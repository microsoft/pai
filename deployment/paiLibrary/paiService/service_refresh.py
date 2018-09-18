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

from __future__ import print_function

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
            for role in self.service_conf['deploy-rules']:
                if 'in' in role:
                    # If machinelist config has defined the label
                    if role['in'] in host:  
                        # Label the node                 
                        cmd = "kubectl label --overwrite=true nodes " + host[ 'nodename' ] + " " + role['in'] +"='true' || exit $?"
                        linux_shell.execute_shell(cmd, err_msg_prefix + " when labeling nodes.")

                        # If machinelist config has defined label, but service not runnning, start the service
                        cmd = "kubectl get po -o wide | grep " + host['nodename'] + " | grep -q " + self.service_name
                        if not linux_shell.execute_shell_return(cmd, err_msg_prefix + " when kubectl get pods."):
                            print("Start service " + self.service_name + " frome Node " + host[ 'nodename'] + " according to the cluster-configuration.yaml label definithion change")
                            start_script = "src/{0}/deploy/{1}".format(self.service_name, self.service_conf["start-script"])
                            linux_shell.execute_shell("/bin/bash " + start_script, err_msg_prefix + " when starting service.")
                                       
                   else:
                        cmd = "kubectl describe node " + host[ 'nodename' ] + " | grep -q " + role['in'] + "='true'"
                        if linux_shell.execute_shell_return(cmd, err_msg_prefix + " when kubectl describe node."):
                            print("Remove Node " + host[ 'nodename'] + " label " + role['in'] + ", due to the cluster-configuration machinelist doesn't specify this label")
                            cmd = "kubectl label nodes " + host[ 'nodename' ] + " " + role['in'] +"- || exit $?"
                            linux_shell.execute_shell(cmd, err_msg_prefix + " when kubectl label nodes")

                        cmd = "kubectl get po -o wide | grep " + host['nodename'] + " | grep -q " + self.service_name
                        if linux_shell.execute_shell_return(cmd, err_msg_prefix + " when kubectl get pods."):          
                            # Delete the specific single pod
                            print("Stop service " + self.service_name + " frome Node " +  host[ 'nodename'] + " according to the cluster-configuration label definithion change")
                            cmd = "a=`kubectl get po -o wide | grep " + host['nodename'] + " | grep " + self.service_name + "`;arr=($a);kubectl delete pod ${arr[0]}" 
                            linux_shell.execute_shell(cmd, err_msg_prefix + cmd)

                if 'notin' in role:
                    # If machinelist config has defined the label
                    if role['notin'] in host:
                        # Label the node
                        cmd = "kubectl label --overwrite=true nodes " + host[ 'nodename' ] + " " + role['notin'] + "='true' || exit $?"
                        linux_shell.execute_shell(cmd, err_msg_prefix + " when kubectl label nodes.")     
                    else:
                        cmd = "kubectl describe node " + host[ 'nodename' ] + " | grep -q " + role['notin'] + "='true'"
                        if linux_shell.execute_shell_return(cmd, err_msg_prefix + " when kubectl describe node."):
                             print("Remove Node " + host[ 'nodename'] + " label " + role['notin'] + ", due to the cluster-configuration machinelist doesn't specify this label")
                             cmd = "kubectl label nodes " + host[ 'nodename' ] + " " + role['notin'] +"- || exit $?"

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





