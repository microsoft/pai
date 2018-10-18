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

from ..common import linux_shell



class service_refresh:


    def __init__(self, service_conf, service_name, label_map):

        self.logger = logging.getLogger(__name__)

        self.service_conf = service_conf
        self.service_name = service_name
        self.label_map = label_map



    def start(self):     
        # Check label definition in machinelist, keep nodes' labels consistent with configuration
        # Ensure pods sheduled correctly with labels
        err_msg_prefix = "Error refreshing service " + self.service_name + " when execute: "
        if 'deploy-rules' in self.service_conf:
            for rule in self.service_conf['deploy-rules']:
                if 'in' in rule:
                    # If service not runnning on labeled node, start the service
                    if rule['in'] not in self.label_map:
                        self.logger.error("Label defined error, " + rule['in'] + " isn't supported in cluster-configuration.yaml machinelist.")
                    nodes = self.label_map[rule['in']]
                    for nodename in nodes:                        
                        cmd_checkservice = "kubectl get po -o wide | grep " + nodename + " | grep -q " + self.service_name
                        if not linux_shell.execute_shell_return(cmd_checkservice, ""):
                            self.logger.info("Start service " + self.service_name + " frome Node " + nodename + 
                                " for its deployment label is labeled on this node according to the cluster-configuration machinelist but service isn't running.")
                            start_script = "src/{0}/deploy/{1}".format(self.service_name, self.service_conf["start-script"])
                            linux_shell.execute_shell("/bin/bash " + start_script, err_msg_prefix + " start service " + self.service_name)
                
                    # If service run on not labeled node, delete it.
                    cmd = "kubectl get po -o wide | grep " + self.service_name
                    res = linux_shell.execute_shell_with_output(cmd, "")
                    items = res.split("\n")
                    nodes_has_service = dict()
                    for item in items:
                        if len(item) > 10:
                            item = item.split()
                            nodes_has_service[item[-1]] = item[0]
                    for n in nodes_has_service:
                        if n not in nodes: 
                            self.logger.info("Service " + self.service_name + " should not run on " + n + 
                                " according to its deploy-rules of service.yaml config file. Deleting...")           
                            cmd = "kubectl delete pod " + nodes_has_service[n]
                            linux_shell.execute_shell(cmd, err_msg_prefix + cmd)
                
                # for 'notin' rule, it's Daemonset, needn't do anything
                if 'notin' in rule:
                    if rule['notin'] not in self.label_map:
                        self.logger.error("Label defined error, " + rule['notin'] + " isn't defined in cluster-configuration.yaml machinelist.")

        refresh_script = "src/{0}/deploy/{1}".format(self.service_name, self.service_conf["refresh-script"])
        cmd = "/bin/bash {0}".format(refresh_script)
        err_msg = "Failed to execute the refresh script of service {0}".format(self.service_name)
        self.logger.info("Begin to execute service {0}'s refresh script.".format(self.service_name))
        linux_shell.execute_shell(cmd, err_msg)


    def get_dependency(self):

        if "prerequisite" not in self.service_conf:
            return None
        return self.service_conf["prerequisite"]


    def run(self):

        self.start()





