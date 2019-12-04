#!/usr/bin/python
# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import argparse
import collections
import faulthandler
import logging
import os
import signal
import sys
import time
import threading

import prometheus_client
from prometheus_client.twisted import MetricsResource
from twisted.internet import reactor
from twisted.web.resource import Resource
from twisted.web.server import Site

#pylint: disable=wrong-import-position
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__))))
from prom_metric_generator import PromMetricGenerator
#pylint: enable=wrong-import-position

LOGGER = logging.getLogger(__name__)


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
            sys.stderr.write("unknown logging level " + level +
                             ", default to INFO\n")
            result = logging.INFO

    return result


def try_remove_old_prom_file(path) -> None:
    """ try to remove old prom file, since old prom file are exposed by node-exporter,
    if we do not remove, node-exporter will still expose old metrics """
    if os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            LOGGER.warning("can not remove old prom file %s",
                           path,
                           exc_info=True)


class AtomicRef(object):
    """ a thread safe way to store and get object, should not modify data get from this ref """
    def __init__(self):
        self.data = None
        self.lock = threading.RLock()

    def get_and_set(self, new_data):
        data = None
        with self.lock:
            data, self.data = self.data, new_data
        return data

    def get(self):
        with self.lock:
            return self.data


class HealthResource(Resource):
    def render_GET(self, request) -> bytes:
        request.setHeader("Content-Type", "text/html; charset=utf-8")
        return "<html>Ok</html>".encode("utf-8")


class CustomCollector(object):
    def __init__(self, atomic_ref):
        self.atomic_ref = atomic_ref

    def collect(self):
        data = self.atomic_ref.get()

        if data is not None:
            for datum in data:
                yield datum
        else:
            return


def metric_collection_loop(atomic_ref, interval):
    metric_generator = PromMetricGenerator()
    while True:
        result = []
        try:
            pods_info = collections.defaultdict(lambda: [])
            result.extend(metric_generator.generate_pods_metrics(pods_info))
            result.extend(metric_generator.generate_nodes_metrics(pods_info))
            result.extend(
                metric_generator.generate_k8s_component_health_metrics())
        except Exception:  #pylint: disable=broad-except
            metric_generator.add_error_counter(error_type="unknown")
            LOGGER.exception("watchdog failed in one iteration")

        atomic_ref.get_and_set(result)
        time.sleep(float(interval))


def start_watchdog(args) -> None:
    LOGGER.info("Watchdog Sarting")
    log_dir = args.log
    interval = args.interval
    try_remove_old_prom_file(log_dir)
    atomic_ref = AtomicRef()

    thread = threading.Thread(target=metric_collection_loop,
                              name="metric_collotion_loop",
                              args=(atomic_ref, interval),
                              daemon=True)
    thread.start()

    prometheus_client.REGISTRY.register(CustomCollector(atomic_ref))

    root = Resource()
    root.putChild(b"metrics", MetricsResource())
    root.putChild(b"healthz", HealthResource())

    factory = Site(root)
    reactor.listenTCP(int(args.port), factory)
    reactor.run()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--log",
                        "-l",
                        help="log dir to store log",
                        default="/datastorage/prometheus")
    parser.add_argument("--interval",
                        "-i",
                        help="interval between two collection",
                        default="30")
    parser.add_argument("--port",
                        "-p",
                        help="port to expose metrics",
                        default="9101")
    args = parser.parse_args()
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=get_logging_level())

    faulthandler.register(signal.SIGTRAP, all_threads=True, chain=False)
    start_watchdog(args)


if __name__ == "__main__":
    main()
