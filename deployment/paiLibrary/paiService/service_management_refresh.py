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


import logging
import logging.config

from . import service_template_generate
from . import service_template_clean
from . import service_management_configuration

from ..common import directory_handler
from ..common import file_handler
from ..common import linux_shell


class service_management_refresh:

    def __init__(self, kube_config_path=None, service_list=None, **kwargs):
        self.logger = logging.getLogger(__name__)

        self.cluster_object_model = service_management_configuration.get_cluster_object_model_from_k8s(kube_config_path)
        self.kube_config_path = kube_config_path
        self.cluster_type = None

        if service_list is None:
            if "cluster-type" in self.cluster_object_model["cluster"]["common"]:
                self.cluster_type = self.cluster_object_model["cluster"]["common"]["cluster-type"]
            self.service_list = service_management_configuration.get_service_list(self.cluster_type)
        else:
            self.service_list = service_list
        self.logger.info("Get the service-list to manage : {0}".format(str(self.service_list)))

        self.label_map = dict()

    def refresh_all_label(self):
        self.logger.info("Begin to refresh all the nodes' labels")
        machinelist = self.cluster_object_model['layout']['machine-list']

        labels = ['pai-master', 'pai-worker', 'pai-storage', 'no-drivers', 'no-nodeexporter']
        logging.info("Currently supported labels: " + str(labels))
        for label in labels:
            self.label_map[label] = list()

        err_msg_prefix = "Error refreshing all label when execute: "
        for host in machinelist:
            nodename = machinelist[host]['nodename']
            for label in labels:
                cmd_checklabel = "kubectl describe node " + nodename + " | grep -q " + label + "='true'"
                has_label = linux_shell.execute_shell_return(cmd_checklabel, "")
                # If machinelist config has defined the label, but the node did't have, label it
                if label in machinelist[host]:
                    self.label_map[label].append(nodename)
                    if not has_label:
                        self.logger.info("Label defined in cluster-configuration machinelist, label the node " + str(nodename) + " of " + label)
                        cmd = "kubectl label --overwrite=true nodes " + nodename + " " + label + "='true' || exit $?"
                        linux_shell.execute_shell(cmd, err_msg_prefix + cmd)
                # If machinelist config has not define the label, but the node has the label, remove it
                else:
                    if has_label:
                        self.logger.info("Remove Node " + nodename + " label " + label + ", due to the cluster-configuration machinelist doesn't specify this label")
                        cmd = "kubectl label nodes " + nodename + " " + label + "- || exit $?"
                        linux_shell.execute_shell(cmd, err_msg_prefix + " when kubectl label nodes")

    def refresh_service(self, service_conf, service_name, label_map):
        # Check label definition in machinelist, keep nodes' labels consistent with configuration
        # Ensure pods sheduled correctly with labels
        err_msg_prefix = "Error refreshing service " + service_name + " when execute: "
        if 'deploy-rules' in service_conf:
            for rule in service_conf['deploy-rules']:
                if 'in' in rule:
                    # If service not runnning on labeled node, start the service
                    if rule['in'] not in label_map:
                        self.logger.error("Label defined error, " + rule['in'] + " isn't supported in layout.yaml machinelist.")
                    nodes = self.label_map[rule['in']]
                    for nodename in nodes:
                        cmd_checkservice = "kubectl get po -o wide | grep " + nodename + " | grep -q " + service_name
                        if not linux_shell.execute_shell_return(cmd_checkservice, ""):
                            self.logger.info("Start service " + service_name + " frome Node " + nodename +
                                             " for its deployment label is labeled on this node according to the cluster-configuration machinelist but service isn't running.")
                            start_script = "src/{0}/deploy/{1}".format(service_name, service_conf["start-script"])
                            linux_shell.execute_shell("/bin/bash " + start_script, err_msg_prefix + " start service " + service_name)

                    # If service run on not labeled node, delete it.
                    cmd = "kubectl get po -o wide | grep " + service_name
                    res = linux_shell.execute_shell_with_output(cmd, "")
                    items = res.split("\n")
                    nodes_has_service = dict()
                    for item in items:
                        if len(item) > 10:
                            item = item.split()
                            nodes_has_service[item[-1]] = item[0]
                    for n in nodes_has_service:
                        if n not in nodes:
                            self.logger.info("Service " + service_name + " should not run on " + n +
                                             " according to its deploy-rules of service.yaml config file. Deleting...")
                            cmd = "kubectl delete pod " + nodes_has_service[n]
                            linux_shell.execute_shell(cmd, err_msg_prefix + cmd)

                # for 'notin' rule, it's Daemonset, needn't do anything
                if 'notin' in rule:
                    if rule['notin'] not in label_map:
                        self.logger.error("Label defined error, " + rule['notin'] + " isn't defined in layout.yaml machinelist.")

        refresh_script = "src/{0}/deploy/{1}".format(service_name, service_conf["refresh-script"])
        cmd = "/bin/bash {0}".format(refresh_script)
        err_msg = "Failed to execute the refresh script of service {0}".format(service_name)
        self.logger.info("Begin to execute service {0}'s refresh script.".format(service_name))
        linux_shell.execute_shell(cmd, err_msg)

    def start(self, serv):

        if serv in self.done_dict and self.done_dict[serv] == True:
            return

        service_conf = file_handler.load_yaml_config("src/{0}/deploy/service.yaml".format(serv))

        dependency_list = service_conf.get("prerequisite")
        if dependency_list != None:
            for fat_serv in dependency_list:
                if fat_serv not in self.service_list:
                    continue
                if fat_serv in self.done_dict and self.done_dict[fat_serv] == True:
                    continue
                self.start(fat_serv)

        self.logger.info("-----------------------------------------------------------")
        self.logger.info("Begin to generate service {0}'s template file".format(serv))
        service_template_generater = service_template_generate.service_template_generate(self.cluster_object_model, serv, service_conf)
        service_template_generater.run()

        self.logger.info("Begin to refresh service: [ {0} ]".format(serv))
        self.refresh_service(service_conf, serv, self.label_map)

        self.logger.info("Begin to clean all service's generated template file".format(serv))
        service_template_cleaner = service_template_clean.service_template_clean(serv, service_conf)
        service_template_cleaner.run()

        self.logger.info("Successfully refresh {0}".format(serv))
        self.logger.info("-----------------------------------------------------------")

        self.done_dict[serv] = True

    def run(self):
        self.done_dict = dict()
        self.refresh_all_label()
        for serv in self.service_list:
            if file_handler.file_exist_or_not("src/{0}/deploy/service.yaml".format(serv)) == False:
                self.logger.warning("service.yaml can't be found on the directory of {0}".format(serv))
                self.logger.warning("Please check your source code. The {0}'s service will be skipped.".format(serv))
                continue
            if serv in self.done_dict and self.done_dict[serv] == True:
                continue
            self.start(serv)
