
import os
import time
import logging
import copy

from reader import ClusterConfigReader, VcConfigReader
from action import YarnHandle
from utils import generate_k8s_config


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)



def init_vc_config(cluster_configuration_dir, vc_configuration_dir):
    cluster_config_reader = ClusterConfigReader(conf_dir=cluster_configuration_dir)
    vc_config_reader = VcConfigReader(conf_dir=vc_configuration_dir)
    if vc_config_reader.check_config_exists():
        return

    # TODO: access api-server with internal ip
    # generate k8s config
    api_servers_ip = os.environ.get("API_SERVERS_IP")
    if api_servers_ip is None:
        logger.error("Can\'t find api servers ip.")
        raise RuntimeError("Can\'t find api servers ip.")
    generate_k8s_config(api_servers_ip)

    # first boot up, copy vc configuration from cluster configuration
    service_dict = cluster_config_reader.load_config()
    vc_dict = {"virtualClusters": service_dict["clusterinfo"]["virtualClusters"]}
    vc_config_reader.save_config(vc_dict)
    while not vc_config_reader.check_config_exists():
        time.sleep(5)


class ConfigObject(object):
    def __init__(self, config_reader, action_handle):
        self.config_reader = config_reader
        self.action_handle = action_handle
        self.current_timestamp = None
        self.current_cluster_config = None

    def get_timestamp(self):
        return self.current_timestamp 

    def load_timestamp(self):
        self.current_timestamp = self.config_reader.load_timestamp()
        if self.current_timestamp is None:
            logger.error("Can't find effective timestamp.")
            raise RuntimeError("Can't find effective timestamp.")

    def get_cluster_config(self):
        return self.current_cluster_config 

    def load_cluster_config(self):
        self.current_cluster_config = self.config_reader.load_config()

    def update_service(self):
        try:
            self.action_handle.update(self.current_cluster_config)
        except Exception as e:
            logger.exception(e)
            logger.error("Failed to update service with dict {}".format(self.current_cluster_config))
            return False
        return True


class Monitor(object):
    def __init__(self, config_object, monitor_interval=5):
        self.current_config_object = config_object
        self.new_config_object = copy.deepcopy(config_object)
        self.monitor_interval = monitor_interval

    def monitor(self):
        while True:
            # Wait config timestamp change
            while self.new_config_object.get_timestamp() == self.current_config_object.get_timestamp():
                logger.debug("Config have no change, current timestamp: {}".format(self.new_config_object.get_timestamp()))
                time.sleep(self.monitor_interval)
                self.new_config_object.load_timestamp()

            logger.info("Config changed, current timestamp: {0}, new timestamp: {1}".format(
                self.current_config_object.get_timestamp(), self.new_config_object.get_timestamp()))
            self.new_config_object.load_cluster_config()

            # Update
            update_success = self.new_config_object.update_service()
            if update_success:
                logger.info("Update service success")
                self.current_config_object = copy.deepcopy(self.new_config_object)
            else:
                logger.error("Can't update service with latest config")
                exit(1)


if __name__ == "__main__":

    cluster_configuration_dir = "/cluster-configuration"    # ConfigMap
    vc_configuration_dir = "/vc-configuration"      # ConfigMap
    service_template_dir = "/hadoop-configuration-template"     # ConfigMap
    service_dst_dir = "/hadoop-configuration"       # Local dir

    init_vc_config(cluster_configuration_dir, vc_configuration_dir)

    vc_config_reader = VcConfigReader(conf_dir=vc_configuration_dir)
    yarn_handle = YarnHandle(template_dir=service_template_dir, dst_dir=service_dst_dir)

    monitor = Monitor(ConfigObject(vc_config_reader, yarn_handle))
    monitor.monitor()



            





