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

import os
import yaml
import logging
import logging.config

from . import linux_shell


logger = logging.getLogger(__name__)



def load_yaml_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f)

    return cluster_data



def read_template(template_path):

    with open(template_path, "r") as f:
        template_data = f.read().decode('utf-8')

    return template_data



def write_generated_file(file_path, content_data):

    with open(file_path, "w+") as fout:
        fout.write(content_data)



def file_exist_or_not(file_path):

    return os.path.isfile(str(file_path))



def file_delete(file_path):

    if file_exist_or_not(file) == True:
        shell_cmd = "rm -rf {0}".format(file_path)
        error_msg = "failed to rm {0}".format(file_path)
        linux_shell.execute_shell(shell_cmd, error_msg)


def create_folder_if_not_exist(folder_path):
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)


def add_deploy_rule_to_yaml(service_conf, src_yaml, dst_yaml):
    
    config = dict()
    service_deploy_kind_list = ['DaemonSet', 'Deployment', 'StatefulSets', 'Pod']

    with open(src_yaml, 'r') as f:
        config = yaml.load(f)

        if 'kind' in config and config['kind'] in service_deploy_kind_list:
            match_expressions_arr = []

            deploy_rules =service_conf['deploy-rules']
            for operator, label in deploy_rules.items():
                match_expression = dict()
                if operator.lower() == 'in':   
                    match_expression['operator'] = 'In'
                if operator.lower() == 'notin':
                    match_expression['operator'] = 'NotIn'
                              
                match_expression['key'] = label
                match_expression['values'] = ['true']
                match_expressions_arr.append(match_expression)

            config['spec']['template']['spec']['affinity'] = {'nodeAffinity': \
                {'requiredDuringSchedulingIgnoredDuringExecution': {'nodeSelectorTerms': \
                [{'matchExpressions': match_expressions_arr}]}}}
        
        else:
            logging.info(src_yaml + " is not a service deploy file! Only support " + str(service_deploy_kind_list))

    with open(dst_yaml, "w") as fout:
        yaml.dump(config, fout)