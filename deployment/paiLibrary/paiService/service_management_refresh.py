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

from . import service_refresh
from . import service_template_generate
from . import service_template_clean

from ..common import directory_handler
from ..common import file_handler
from ..common import linux_shell


class service_management_refresh:


    def __init__(self, cluster_object_model, service_list = None, **kwargs):
        self.logger = logging.getLogger(__name__)

        self.cluster_object_model = cluster_object_model

        if service_list == None:
            self.service_list = self.get_service_list()
        else:
            self.service_list = service_list

        self.label_map = dict()

    def get_service_list(self):

        service_list = list()

        subdir_list = directory_handler.get_subdirectory_list("src/")
        for subdir in subdir_list:

            service_deploy_dir = "src/{0}/deploy".format(subdir)
            service_deploy_conf_path =  "src/{0}/deploy/service.yaml".format(subdir)
            if file_handler.directory_exits(service_deploy_dir) and file_handler.file_exist_or_not(service_deploy_conf_path):
                service_list.append(subdir)

        self.logger.info("Get the service-list to manage : {0}".format(str(service_list)))

        return service_list


    def refresh_all_label(self):
        self.logger.info("Begin to refresh all the nodes' labels")
        machinelist = self.cluster_object_model['machinelist']
        
        labels = ['pai-master', 'pai-worker', 'no-driver', 'no-nodeexporter']
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
                        cmd = "kubectl label --overwrite=true nodes " + nodename + " " + label +"='true' || exit $?"
                        linux_shell.execute_shell(cmd, err_msg_prefix + cmd)
                # If machinelist config has not define the label, but the node has the label, remove it
                else:
                    if has_label:
                        self.logger.info("Remove Node " + nodename + " label " + label + ", due to the cluster-configuration machinelist doesn't specify this label")
                        cmd = "kubectl label nodes " + nodename + " " + label +"- || exit $?"
                        linux_shell.execute_shell(cmd, err_msg_prefix + " when kubectl label nodes")



    def start(self, serv):

        if serv in self.done_dict and self.done_dict[serv] == True:
            return

        service_conf = file_handler.load_yaml_config("src/{0}/deploy/service.yaml".format(serv))
        machinelist = self.cluster_object_model['machinelist']
        service_refresher = service_refresh.service_refresh(service_conf, serv, self.label_map)

        dependency_list = service_refresher.get_dependency()
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
        service_refresher.run()

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