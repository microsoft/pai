import os
import re
import json

from deployment.paiLibrary.clusterObjectModel import objectModelFactory
from deployment.confStorage.conf_storage_util import update_configmap


class ConfigReader(object):
    # An effective timestamp: ..2018_09_10_07_59_11.260092899
    timestamp_pattern = re.compile(r'\.{2}\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.\d{9}')

    def __init__(self, conf_dir):
        self.conf_dir = conf_dir
        self.config_files = []

    def load_config(self):
        raise NotImplementedError

    def save_config(self, save_data):
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

    def load_config(self):
        object_model = objectModelFactory.objectModelFactory(self.conf_dir)
        ret = object_model.objectModelPipeLine()
        return ret["service"]


class VcConfigReader(ConfigReader):

    configmap_name = "vc-configuration"
    k8s_config_path = os.path.expanduser("~/.kube/config")

    def __init__(self, conf_dir):
        super(VcConfigReader, self).__init__(conf_dir)
        self.config_files = ["vc-configuration.json"]

    def load_config(self):
        with open(os.path.join(self.conf_dir, self.config_files[0]), 'r') as f:
            vc_config_raw = json.load(f)
        vc_config = {"clusterinfo": vc_config_raw}
        return vc_config

    def save_config(self, vc_dict):
        vc_dict_str = json.dumps(vc_dict)
        conf_dict = {self.config_files[0]: vc_dict_str}
        update_configmap(self.k8s_config_path, self.configmap_name, conf_dict)