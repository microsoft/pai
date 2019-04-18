#!/usr/bin/env python3

import argparse
import logging
import os
import json
import threading
import signal
import faulthandler
import gc
import datetime

import prometheus_client
from prometheus_client import Gauge
from prometheus_client.core import REGISTRY
from prometheus_client.twisted import MetricsResource

from twisted.web.server import Site
from twisted.web.resource import Resource
from twisted.internet import reactor

import collector

logger = logging.getLogger(__name__)


configured_gpu_counter = Gauge("configured_gpu_count",
        "total number of gpu configured for this node")


class CustomCollector(object):
    def __init__(self, atomic_refs):
        self.atomic_refs = atomic_refs

    def collect(self):
        data = []

        now = datetime.datetime.now()

        for ref in self.atomic_refs:
            d = ref.get(now)
            if d is not None:
                data.extend(d)

        if len(data) > 0:
            for datum in data:
                yield datum
        else:
            # https://stackoverflow.com/a/6266586
            # yield nothing
            return
            yield


def config_environ():
    """ since job-exporter needs to call nvidia-smi, we need to change
    LD_LIBRARY_PATH to correct value """
    driver_path = os.environ.get("NV_DRIVER")
    logger.debug("NV_DRIVER is %s", driver_path)

    ld_path = os.environ.get("LD_LIBRARY_PATH", "")
    os.environ["LD_LIBRARY_PATH"] = ld_path + os.pathsep + \
            os.path.join(driver_path, "lib") + os.pathsep + \
            os.path.join(driver_path, "lib64")

    driver_bin_path = os.path.join(driver_path, "bin")
    os.environ["PATH"] = os.environ["PATH"] + ":" + driver_bin_path

    logger.debug("LD_LIBRARY_PATH is %s, PATH is %s",
            os.environ["LD_LIBRARY_PATH"],
            os.environ["PATH"])


def try_remove_old_prom_file(path):
    """ try to remove old prom file, since old prom file are exposed by node-exporter,
    if we do not remove, node-exporter will still expose old metrics """
    if os.path.isfile(path):
        try:
            os.unlink(path)
        except Exception as e:
            log.warning("can not remove old prom file %s", path)


def get_gpu_count(path):
    hostname = os.environ.get("HOSTNAME")
    ip = os.environ.get("HOST_IP")

    logger.debug("hostname is %s, ip is %s", hostname, ip)

    if os.path.isfile(path):
        with open(path) as f:
            gpu_config = json.load(f)

        if hostname is not None and gpu_config["nodes"].get(hostname) is not None:
            return gpu_config["nodes"][hostname]["gpuCount"]
        elif ip is not None and gpu_config["nodes"].get(ip) is not None:
            return gpu_config["nodes"][ip]["gpuCount"]

    logger.warning("failed to find gpu count from config %s", path)
    return 0


def register_stack_trace_dump():
    faulthandler.register(signal.SIGTRAP, all_threads=True, chain=False)


# https://github.com/prometheus/client_python/issues/322#issuecomment-428189291
def burninate_gc_collector():
    for callback in gc.callbacks[:]:
        if callback.__qualname__.startswith("GCCollector."):
            gc.callbacks.remove(callback)

    for name, collector in list(prometheus_client.REGISTRY._names_to_collectors.items()):
        if name.startswith("python_gc_"):
            try:
                prometheus_client.REGISTRY.unregister(collector)
            except KeyError:  # probably gone already
                pass


class HealthResource(Resource):
    def render_GET(self, request):
        request.setHeader("Content-Type", "text/html; charset=utf-8")
        return "<html>Ok</html>".encode("utf-8")


def main(args):
    register_stack_trace_dump()
    burninate_gc_collector()
    config_environ()
    try_remove_old_prom_file(args.log + "/gpu_exporter.prom")
    try_remove_old_prom_file(args.log + "/job_exporter.prom")
    try_remove_old_prom_file(args.log + "/docker.prom")
    try_remove_old_prom_file(args.log + "/time.prom")
    try_remove_old_prom_file(args.log + "/configured_gpu.prom")

    configured_gpu_counter.set(get_gpu_count("/gpu-config/gpu-configuration.json"))

    decay_time = datetime.timedelta(seconds=args.interval * 2)

    # used to exchange gpu info between GpuCollector and ContainerCollector
    gpu_info_ref = collector.AtomicRef(decay_time)

    # used to exchange docker stats info between ContainerCollector and ZombieCollector
    stats_info_ref = collector.AtomicRef(decay_time)

    # used to exchange zombie info between GpuCollector and ZombieCollector
    zombie_info_ref = collector.AtomicRef(decay_time)

    interval = args.interval
    # Because all collector except container_collector will spent little time in calling
    # external command to get metrics, so they need to sleep 30s to align with prometheus
    # scrape interval. The 99th latency of container_collector loop is around 20s, so it
    # should only sleep 10s to adapt to scrape interval
    collector_args = [
            ("docker_daemon_collector", interval, decay_time, collector.DockerCollector),
            ("gpu_collector", interval, decay_time, collector.GpuCollector, gpu_info_ref, zombie_info_ref, args.threshold),
            ("container_collector", max(0, interval - 18), decay_time, collector.ContainerCollector,
                gpu_info_ref, stats_info_ref, args.interface),
            ("zombie_collector", interval, decay_time, collector.ZombieCollector, stats_info_ref, zombie_info_ref),
            ("process_collector", interval, decay_time, collector.ProcessCollector),
            ]

    refs = list(map(lambda x: collector.make_collector(*x), collector_args))

    REGISTRY.register(CustomCollector(refs))

    root = Resource()
    root.putChild(b"metrics", MetricsResource())
    root.putChild(b"healthz", HealthResource())
    factory = Site(root)
    reactor.listenTCP(int(args.port), factory)
    reactor.run()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--log", "-l", help="log dir to store log", default="/datastorage/prometheus")
    parser.add_argument("--port", "-p", help="port to expose metrics", default="9102")
    parser.add_argument("--interval", "-i", help="prometheus scrape interval second", type=int, default=30)
    parser.add_argument("--interface", "-n", help="network interface for job-exporter to listen on", required=True)
    parser.add_argument("--threshold", "-t", help="memory threshold to consider gpu memory leak", type=int, default=20 * 1024 * 1024)
    args = parser.parse_args()

    def get_logging_level():
        mapping = {
                "DEBUG": logging.DEBUG,
                "INFO": logging.INFO,
                "WARNING": logging.WARNING
                }

        result = logging.INFO

        if os.environ.get("LOGGING_LEVEL") is not None:
            level = os.environ["LOGGING_LEVEL"]
            result = mapping.get(level.upper())
            if result is None:
                sys.stderr.write("unknown logging level " + level + \
                        ", default to INFO\n")
                result = logging.INFO

        return result

    logging.basicConfig(format="%(asctime)s - %(levelname)s - %(threadName)s - %(filename)s:%(lineno)s - %(message)s",
            level=get_logging_level())

    main(args)
