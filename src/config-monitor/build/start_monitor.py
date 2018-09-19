
import os


import time
import re

from deployment.paiLibrary.clusterObjectModel import objectModelFactory


def get_dict_by_keys(dict_items, key_list):
    for key in key_list:
        if key in dict_items:
            dict_items = dict_items[key]
        else:
            return None
    return dict_items


class ConfigOp(object):
    def __init__(self, conf_dir):
        self.conf_dir = conf_dir

    def load_cluster_config(self):
        objectModel = objectModelFactory.objectModelFactory(self.conf_dir)
        ret = objectModel.objectModelPipeLine()
        return ret

    def save_cluster_config(self):
        raise NotImplementedError

    def get_timestamp(self):
        pass


    def generate_service_config(self):
        pass

class ActionOp(object):

    def __init__(self):
        self.k8s_uri = None

    def restart(self):
        pass


class Config(object):
    def __init__(self, config_op, action_op, items=None):
        self.config_op = config_op
        self.action_op = action_op
        self.items = items
        self.current_timestamp = self.config_op.get_timestamp()
        self.current_cluster_config = self.config_op.load_cluster_config()


    def check_no_change(self):
        return self.config_op.get_timestamp() == self.current_timestamp

    def update(self):
        new_cluster_config = self.config_op.load_cluster_config()
        new_timestamp = self.config_op.get_timestamp()

        # With specific items, only this items' change would restart service
        if self.items is not None:

            for item in self.observe_items:
                dict_keys = item.split("#")
                if get_dict_by_keys(new_cluster_config, dict_keys) != \
                        get_dict_by_keys(self.current_cluster_config, dict_keys):
                    break
            else:
                return False
        # Without specific items, for any config change would restart service
        return self.update_service(new_cluster_config, new_timestamp)

    def update_service(self, cluster_config, timestamp):
        try:
            self._generate_service_config(cluster_config)
            self._apply_service_config()
        except:
            self._generate_service_config(self.current_cluster_config)
            self._apply_service_config()
            return False
        else:
            self.current_cluster_config = cluster_config
            self.current_timestamp = timestamp
            return True





    def _generate_service_config(self, cluster_config):
        self.config_op.generate_service_config(cluster_config)

    def _apply_service_config(self):
        self.action_op.restart()



class Monitor(object):
    def __init__(self, config_object, monitor_interval=5):
        self.config_object = config_object
        self.monitor_interval = monitor_interval



    def monitor(self):
        while True:
            while self.config_object.check_no_change():
                time.sleep(self.monitor_interval)
            self.config_object.update()
            





