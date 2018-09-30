
import os
import time
import re
import logging
import copy
import shutil
import json

from deployment.paiLibrary.common import file_handler, template_handler
from deployment.paiLibrary.clusterObjectModel import objectModelFactory
from deployment.confStorage.conf_storage_util import update_configmap
from deployment.k8sPaiLibrary.maintainlib import common

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def get_dict_by_keys(dict_items, key_list):
    for key in key_list:
        if dict is not None and key in dict_items:
            dict_items = dict_items[key]
        else:
            return None
    return dict_items


def touch_file(file_path):
    basedir = os.path.dirname(file_path)
    if basedir != "" and not os.path.exists(basedir):
        os.makedirs(basedir)
    with open(file_path, 'a'):
        os.utime(file_path, None)


def generate_k8s_config(api_servers_ip):
    file_path = "deployment/k8sPaiLibrary/template/config.template"
    template_data = common.read_template(file_path)
    dict_map = {
        "clusterconfig": {"api-servers-ip": api_servers_ip},
    }
    generated_data = common.generate_from_template_dict(template_data, dict_map)

    kube_config_path = os.path.expanduser("~/.kube")
    os.mkdir(kube_config_path)
    common.write_generated_file(generated_data, "{0}/config".format(kube_config_path))


def generate_vc_from_cluster(cluster_config_reader, vc_config_reader):
    service_dict = cluster_config_reader.load_cluster_config()
    vc_dict = {"virtualClusters": service_dict["clusterinfo"]["virtualClusters"]}
    vc_config_reader.save_cluster_config(vc_dict)


class ConfigReader(object):
    # An effective timestamp: ..2018_09_10_07_59_11.260092899
    timestamp_pattern = re.compile(r'\.{2}\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.\d{9}')

    def __init__(self, conf_dir):
        self.conf_dir = conf_dir
        self.config_files = []

    def load_cluster_config(self):
        raise NotImplementedError

    def save_cluster_config(self, save_data):
        raise NotImplementedError

    def load_timestamp(self):
        for filename in os.listdir(self.conf_dir):
            match = self.timestamp_pattern.match(filename)
            if match:
                return filename.strip('.')
        return None

    def check_config_exists(self):
        for filename in self.config_files:
            if not os.path.exists(os.path.join(self.conf_dir, filename)):
                return False
        return True


class ClusterConfigReader(ConfigReader):

    def __init__(self, conf_dir):
        super(ClusterConfigReader, self).__init__(conf_dir)
        self.config_files = ["cluster-configuration.yaml",
                             "k8s-role-definition.yaml",
                             "kubernetes-configuration.yaml",
                             "services-configuration.yaml"]

    def load_cluster_config(self):
        object_model = objectModelFactory.objectModelFactory(self.conf_dir)
        ret = object_model.objectModelPipeLine()
        return ret["service"]


class VcConfigReader(ConfigReader):

    configmap_name = "vc-configuration"
    k8s_config_path = os.path.expanduser("~/.kube/config")

    def __init__(self, conf_dir):
        super(VcConfigReader, self).__init__(conf_dir)
        self.config_files = ["vc-configuration.json"]

    def load_cluster_config(self):
        with open(os.path.join(self.conf_dir, self.config_files[0]), 'r') as f:
            vc_config_raw = json.load(f)
        vc_config = {"clusterinfo": vc_config_raw}
        return vc_config

    def save_cluster_config(self, vc_dict):
        vc_dict_str = json.dumps(vc_dict)
        conf_dict = {self.config_files[0]: vc_dict_str}
        update_configmap(self.k8s_config_path, self.configmap_name, conf_dict)


class YarnHandle(object):

    config_copy_list = ["core-site.xml",
                        "hadoop-env.sh",
                        "mapred-site.xml",
                        "resourcemanager-generate-script.sh",
                        "resourcemanager-start-service.sh",
                        "yarn-env.sh",
                        "yarn-site.xml"]
    config_template_list = ["capacity-scheduler.xml"]
    config_ready_file = "/jobstatus/configok"

    def __init__(self, template_dir="/hadoop-configuration-configmap", dst_dir="/hadoop-configuration"):
        self.template_dir = template_dir
        self.dst_dir = dst_dir

    def update(self, cluster_config):
        self.convert_vc_to_hadoop_queues(cluster_config)
        self.generate_service_config_files(cluster_config, self.template_dir, self.dst_dir)
        self.update_config_status()

    # Copy from paictl
    @staticmethod
    def convert_vc_to_hadoop_queues(cluster_config):
        """The method to configure VCs:
          - Each VC corresponds to a Hadoop queue.
          - Each VC will be assigned with (capacity / total_capacity * 100%) of the resources in the system.
          - The system will automatically create the 'default' VC with 0 capacity, if 'default' VC has not
            been explicitly specified in the configuration file.
          - If all capacities are 0, resources will be split evenly to each VC.
        """
        logger.info("Generate hadoop queues from vc")
        hadoop_queues_config = {}
        #
        virtual_clusters_config = cluster_config["clusterinfo"]["virtualClusters"]
        if "default" not in virtual_clusters_config:
            logger.warn("VC 'default' has not been explicitly specified. " +
                "Auto-recoverd by adding it with 0 capacity.")
            virtual_clusters_config["default"] = {
                "description": "Default VC.",
                "capacity": 0
            }
        total_capacity = 0
        for vc_name in virtual_clusters_config:
            if virtual_clusters_config[vc_name]["capacity"] < 0:
                logger.warn("Capacity of VC '%s' (=%f) should be a positive number. " \
                    % (vc_name, virtual_clusters_config[vc_name]["capacity"]) +
                    "Auto-recoverd by setting it to 0.")
                virtual_clusters_config[vc_name]["capacity"] = 0
            total_capacity += virtual_clusters_config[vc_name]["capacity"]
        if float(total_capacity).is_integer() and total_capacity == 0:
            logger.warn("Total capacity (=%d) should be a positive number. " \
                % (total_capacity) +
                "Auto-recoverd by splitting resources to each VC evenly.")
            for vc_name in virtual_clusters_config:
                virtual_clusters_config[vc_name]["capacity"] = 1
                total_capacity += 1
        for vc_name in virtual_clusters_config:
            hadoop_queues_config[vc_name] = {
                "description": virtual_clusters_config[vc_name]["description"],
                "weight": float(virtual_clusters_config[vc_name]["capacity"]) / float(total_capacity) * 100
            }
        #
        cluster_config["clusterinfo"]["hadoopQueues"] = hadoop_queues_config

    @classmethod
    def generate_service_config_files(cls, cluster_config, source_dir, dst_dir):

        logger.info("Begin to copy config files")
        for copy_file in cls.config_copy_list:
            shutil.copy(os.path.join(source_dir, copy_file), os.path.join(dst_dir, copy_file))

        logger.info("Begin to generate template files")
        for template_file in cls.config_template_list:
            template_path = os.path.join(source_dir, template_file + ".template")
            dst_path = os.path.join(dst_dir, template_file)
            template_data = file_handler.read_template(template_path)
            try:
                logger.debug("Generate template file from {0} to {1}".format(template_path, dst_path))
                generated_template = template_handler.generate_from_template_dict(template_data, cluster_config)
            except Exception as e:
                logger.exception("Failed to generate template file from {} with dict {}".format(template_path,
                                                                                                cluster_config))
                raise e
            logger.debug("Write template config to {}".format(dst_path))
            file_handler.write_generated_file(dst_path, generated_template)

    @classmethod
    def update_config_status(cls):
        logger.debug("Update config ready file")
        touch_file(cls.config_ready_file)


class Config(object):
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
            raise RuntimeError("Can't find effective timestamp.")

    def get_cluster_config(self):
        return self.current_cluster_config 

    def load_cluster_config(self):
        self.current_cluster_config = self.config_reader.load_cluster_config()

    def update_service(self):
        try:
            self.action_handle.update(self.current_cluster_config)
        except Exception as e:
            logger.exception("Failed to update service with dict {}".format(self.current_cluster_config))
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
                logger.error("Can't update service with latest cluster config, try to rollback.")
                if not self.current_config_object.update_service():
                    logger.error("Rollback failed, service may be down")


if __name__ == "__main__":

    cluster_configuration_dir = "/cluster-configuration"
    vc_configuration_dir = "/vc-configuration"
    service_template_dir = "/hadoop-configuration-template"
    service_dst_dir = "/hadoop-configuration"

    # generate k8s config
    api_servers_ip = os.environ.get("API_SERVERS_IP")
    if api_servers_ip is None:
        logger.error("Can\'t find api servers ip.")
        exit(1)
    generate_k8s_config(api_servers_ip)


    vc_config_reader = VcConfigReader(conf_dir=vc_configuration_dir)
    # First boot up, copy vc configuration from cluster configuration
    if not vc_config_reader.check_config_exists():
        cluster_config_reader = ClusterConfigReader(conf_dir=cluster_configuration_dir)
        generate_vc_from_cluster(cluster_config_reader, vc_config_reader)
        while not vc_config_reader.check_config_exists():
            time.sleep(5)

    yarn_handle = YarnHandle(template_dir=service_template_dir, dst_dir=service_dst_dir)

    monitor = Monitor(Config(vc_config_reader, yarn_handle))
    monitor.monitor()



            





