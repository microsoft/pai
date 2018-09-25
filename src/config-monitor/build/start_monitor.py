
import os


import time
import re
import logging
import copy
import shutil

from deployment.paiLibrary.common import file_handler, template_handler

from deployment.paiLibrary.clusterObjectModel import objectModelFactory

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def get_dict_by_keys(dict_items, key_list):
    for key in key_list:
        if key in dict_items:
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


class ConfigOp(object):
    timestamp_pattern = re.compile(r'\.{2}\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.\d{9}')
    def __init__(self, conf_dir):
        self.conf_dir = conf_dir
        # An effective timestamp: 2018_09_10_07_59_11.260092899
        # self.timestamp_pattern = re.compile(r'\.{2}\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.\d{9}')

    def load_cluster_config(self):
        object_model = objectModelFactory.objectModelFactory(self.conf_dir)
        ret = object_model.objectModelPipeLine()
        return ret["service"]

    def save_cluster_config(self):
        raise NotImplementedError

    def load_timestamp(self):
        for filename in os.listdir(self.conf_dir):
            match = self.timestamp_pattern.match(filename)
            if match:
                return filename.strip('.')
        return None



class YarnActionOp(object):

    def __init__(self, source_dir="/hadoop-configuration-configmap", dst_dir="/hadoop-configuration"):
        self.source_dir = source_dir
        self.dst_dir = dst_dir
        self.k8s_uri = None
        self.config_copy_list = ["core-site.xml",
                                 "hadoop-env.sh",
                                 "mapred-site.xml",
                                 "resourcemanager-generate-script.sh",
                                 "resourcemanager-start-service.sh",
                                 "yarn-env.sh",
                                 "yarn-site.xml"]
        self.config_template_list = ["capacity-scheduler.xml"]
        self.config_ready_file = "/jobstatus/configok"



    @staticmethod
    def _generate_configuration_of_hadoop_queues(cluster_config):
        """The method to configure VCs:
          - Each VC correspoonds to a Hadoop queue.
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

    def update(self, cluster_config):
        self._generate_configuration_of_hadoop_queues(cluster_config)
        self.generate_service_config_files(cluster_config, self.source_dir, self.dst_dir)
        self.update_config_ready()

    def generate_service_config_files(self, cluster_config, source_dir, dst_dir):
        logger.info("Begin to copy config files")
        for copy_file in self.config_copy_list:
            shutil.copy(os.path.join(source_dir, copy_file), os.path.join(dst_dir, copy_file))
        logger.info("Begin to generate config templates")
        for template_file in self.config_template_list:
            template_path = os.path.join(source_dir, template_file + ".template")
            dst_path = os.path.join(dst_dir, template_file)
            template_data = file_handler.read_template(template_path)
            try:
                logger.debug("Generate template file from {0} to {1}".format(template_path, dst_path))
                generated_template = template_handler.generate_from_template_dict(template_data, cluster_config)
            except Exception as e:
                self.logger.exception("failed to generate template file from %s with dict %s", template_path,
                                      cluster_config)
                raise e
            logger.debug("Write template config to {}".format(dst_path))
            file_handler.write_generated_file(dst_path, generated_template)

    def update_config_ready(self):
        logger.debug("Update config ready file")
        touch_file(self.config_ready_file)






class Config(object):
    def __init__(self, config_op, action_op, items=None):
        self.config_op = config_op
        self.action_op = action_op
        self.items = items
        self.current_timestamp = None
        self.current_cluster_config = None

    def get_timestamp(self):
        return self.current_timestamp 

    def load_timestamp(self):
        self.current_timestamp = self.config_op.load_timestamp()
        if self.current_timestamp is None:
            raise RuntimeError("Can't find effective timestamp.")

    def get_cluster_config(self):
        return self.current_cluster_config 

    def load_cluster_config(self):
        self.current_cluster_config = self.config_op.load_cluster_config()


    def update_service(self):
        try:
            logger.debug(self.current_cluster_config)
            self.action_op.update(self.current_cluster_config)
        except Exception as e:
            logger.error("Update error")
            raise e
            return False
        return True




class Monitor(object):
    def __init__(self, config_object, items=None, monitor_interval=5):
        self.current_config_object = config_object
        self.new_config_object = copy.deepcopy(config_object)
        self.items = items
        self.monitor_interval = monitor_interval

    def check_update_need(self, current_cluster_config, new_cluster_config):
        if self.items is None:
            return True

        for item in self.items:
            dict_keys = item.split("#")
            if get_dict_by_keys(new_cluster_config, dict_keys) != \
                    get_dict_by_keys(current_cluster_config, dict_keys):
                return True

        return False

    def monitor(self):
        # self.current_config_object.load_timestamp()
        # self.current_config_object.load_cluster_config()
        # self.new_config_object.load_timestamp()
        # self.new_config_object.load_cluster_config()
        while True:
            while self.new_config_object.get_timestamp() == self.current_config_object.get_timestamp():
                logger.debug("Config have no change, current timestamp: {}".format(self.new_config_object.get_timestamp()))
                time.sleep(self.monitor_interval)
                self.new_config_object.load_timestamp()
            logger.info("Config changed, current timestamp: {0}, new timestamp: {1}".format(
                self.current_config_object.get_timestamp(), self.new_config_object.get_timestamp()))
            self.new_config_object.load_cluster_config()
            if self.check_update_need(self.current_config_object.get_cluster_config(),
                                        self.new_config_object.get_cluster_config()):
                update_success = self.new_config_object.update_service()
                if update_success:
                    self.current_config_object = copy.deepcopy(self.new_config_object)
                elif self.current_config_object.update_service():
                    logger.warn("Can't update service with latest cluster config, rollback.")
                else:
                    logger.error("Can't update service with latest config, and can't rollback, service may be down")

if __name__ == "__main__":

    yarn_action = YarnActionOp(source_dir="hadoop-configuration-configmap", dst_dir="hadoop-configuration")
    yarn_action.config_ready_file = "configok"
    config_op = ConfigOp(conf_dir="cluster-configuration")
    monitor = Monitor(Config(config_op, yarn_action))
    monitor.monitor()



            





