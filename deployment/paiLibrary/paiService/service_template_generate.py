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
import logging
import logging.config
import yaml

from ..common import template_handler
from ..common import file_handler


package_directory_serv_template_gen = os.path.dirname(os.path.abspath(__file__))


class service_template_generate:

    def __init__(self, cluster_object_model, service_name, service_conf):

        self.logger = logging.getLogger(__name__)

        self.cluster_object_mode = cluster_object_model
        self.service_name = service_name
        self.service_conf = service_conf

        self.src_path = "{0}/../../../src".format(package_directory_serv_template_gen)

    def template_mapper(self):

        # Todo: read configuration from service.yaml?

        self.logger.info("Create template mapper for service {0}.".format(self.service_name))

        service_conf_dict = {
            "cluster_cfg": self.cluster_object_mode
        }

        self.logger.info("Done. Template mapper for service {0} is created.".format(self.service_name))

        return service_conf_dict

    # Add "NodeAffinity" to service deployment yaml file
    # according to the "deploy-rules" in service.yaml config file
    # Currently support "In" and "NotIn" rules or the combination of them.

    def add_deploy_rule_to_yaml(self, str_src_yaml):
        service_deploy_kind_list = ['DaemonSet', 'Deployment', 'StatefulSet', 'Pod']

        config = yaml.load(str_src_yaml, yaml.SafeLoader)

        # judge whether it's a service deploy file, eg. exclude configmap
        # Some service may not being configured to run, for example when alert manager is not
        # configure, alert-manager-deployment.yaml contains nothing, and hence config is None.
        # In this case, return original content.
        if config is not None and 'kind' in config and config['kind'] in service_deploy_kind_list:
            match_expressions_arr = []

            deploy_rules = self.service_conf['deploy-rules']
            for rule in deploy_rules:
                for operator, label in rule.items():
                    match_expression = dict()
                    if operator.lower() == 'in':
                        match_expression['operator'] = 'In'
                    if operator.lower() == 'notin':
                        match_expression['operator'] = 'NotIn'

                    match_expression['key'] = label
                    match_expression['values'] = ['true']
                    match_expressions_arr.append(match_expression)

                config['spec']['template']['spec']['affinity'] = {'nodeAffinity': {'requiredDuringSchedulingIgnoredDuringExecution': {'nodeSelectorTerms': [{'matchExpressions': match_expressions_arr}]}}}
        else:
            logging.info("It is not a service deploy file! Only support " + str(service_deploy_kind_list))
            return str_src_yaml

        return yaml.dump(config, default_flow_style=False)

    def generate_template(self):

        self.logger.info("Begin to generate the template file in service {0}'s configuration.".format(self.service_name))

        service_conf_dict = self.template_mapper()

        if "template-list" not in self.service_conf:
            self.logger.warning("There is no template-list in service {0}'s configuration.".format(self.service_name))
            self.logger.warning("Please check the path bootstrap/{0}/service.yaml.".format(self.service_name))
            return

        for template_file in self.service_conf["template-list"]:

            template_path = "{0}/{1}/deploy/{2}.template".format(self.src_path, self.service_name, template_file)
            target_path = "{0}/{1}/deploy/{2}".format(self.src_path, self.service_name, template_file)

            self.logger.info("Generate the template file {0}.".format(template_path))
            self.logger.info("Save the generated file to {0}.".format(target_path))

            template_data = file_handler.read_template(template_path)
            try:
                generated_template = template_handler.generate_from_template_dict(template_data, service_conf_dict)
            except Exception as e:
                self.logger.exception("failed to generate template file from %s with dict %s", template_path, service_conf_dict)
                raise e

            # judge whether it's a service deploy file
            if "deploy-rules" in self.service_conf and template_file.find("yaml") >= 0 and template_file.find("delete") == -1:
                generated_template = self.add_deploy_rule_to_yaml(generated_template)

            file_handler.write_generated_file(target_path,  generated_template)

        self.logger.info("The template file of service {0} is generated.".format(self.service_name))

    def run(self):

        self.generate_template()
