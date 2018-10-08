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


    def __init__(self, service_conf, serivce_name, machinelist):

        self.logger = logging.getLogger(__name__)

        self.service_conf = service_conf
        self.service_name = serivce_name
        self.machinelist = machinelist



    def start(self):     
        # Check label definition in machinelist, keep nodes' labels consistent with configuration
        # Ensure pods sheduled correctly with labels
        err_msg_prefix = "Error refreshing service " + self.service_name + " when execute: "
        for host in self.machinelist:
            nodename = self.machinelist[host]['nodename']
            for rule in self.service_conf['deploy-rules']:
                if 'in' in rule:
                    # If machinelist config has defined the label
                    if rule['in'] in self.machinelist[host]:  
                        self.logger.info("Role defined in cluster-configuration machinelist, label the node of this role...")                 
                        cmd = "kubectl label --overwrite=true nodes " + nodename + " " + rule['in'] +"='true' || exit $?"
                        linux_shell.execute_shell(cmd, err_msg_prefix + cmd)

                        # If machinelist config has defined label, but service not runnning, start the service
                        cmd = "kubectl get po -o wide | grep " + nodename + " | grep -q " + self.service_name
                        if not linux_shell.execute_shell_return(cmd, ""):
                            self.logger.info("Start service " + self.service_name + " frome Node " + nodename + 
                                " for its deploy role is labeled on this node according to the cluster-configuration machinelist but service isn't running.")
                            start_script = "src/{0}/deploy/{1}".format(self.service_name, self.service_conf["start-script"])
                            linux_shell.execute_shell("/bin/bash " + start_script, err_msg_prefix + cmd)
                    
                    else:
                        cmd = "kubectl describe node " + nodename + " | grep -q " + rule['in'] + "='true'"
                        if linux_shell.execute_shell_return(cmd, ""):
                            self.logger.info("Remove Node " + nodename + " label " + rule['in'] + ", due to the cluster-configuration machinelist doesn't specify this label")
                            cmd = "kubectl label nodes " + nodename + " " + rule['in'] +"- || exit $?"
                            linux_shell.execute_shell(cmd, err_msg_prefix + " when kubectl label nodes")

                        cmd = "kubectl get po -o wide | grep " + nodename + " | grep -q " + self.service_name
                        if linux_shell.execute_shell_return(cmd, ""):          
                            # Delete the specific single pod
                            self.logger.info("Stop service " + self.service_name + " frome Node " +  nodename + 
                                " for its deploy role isn't labeled on this node according to the cluster-configuration machinelist but service pod is still running on this node")
                            cmd = "kubectl get po -o wide | grep " + nodename + " | grep " + self.service_name
                            res = linux_shell.execute_shell_with_output(cmd, "")
                            pod_name = res.split()[0]
                            cmd = "kubectl delete pod " + pod_name
                            linux_shell.execute_shell(cmd, err_msg_prefix + cmd)

                if 'notin' in rule:
                    # If machinelist config has defined the label
                    if rule['notin'] in self.machinelist[host]:
                        self.logger.info("Role defined in cluster-configuration machinelist, label the node of this role...")
                        cmd = "kubectl label --overwrite=true nodes " + nodename + " " + rule['notin'] + "='true' || exit $?"
                        linux_shell.execute_shell(cmd, err_msg_prefix + cmd)     
                    else:
                        cmd = "kubectl describe node " + nodename + " | grep -q " + rule['notin'] + "='true'"
                        if linux_shell.execute_shell_return(cmd, ""):
                             self.logger.info("Remove Node " + nodename + " label " + rule['notin'] + ", due to the cluster-configuration machinelist doesn't specify this label")
                             cmd = "kubectl label nodes " + nodename + " " + rule['notin'] +"- || exit $?"

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





