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


from ..common import template_handler
from ..common import file_handler




class service_template_generate:



    def __init__(self, cluster_object_model, service_name, service_conf):

        self.logger = logging.getLogger(__name__)

        self.cluster_object_mode = cluster_object_model
        self.service_name = service_name
        self.service_conf = service_conf



    def template_mapper(self):

        ### Todo: read configuration from service.yaml?

        self.logger.info("Create template mapper for service {0}.".format(self.service_name))

        servce_conf_dict = {
            "clusterinfo": self.cluster_object_mode['clusterinfo'],
            "machineinfo": self.cluster_object_mode["machineinfo"],
            "machinelist": self.cluster_object_mode["machinelist"]
        }

        self.logger.info("Done. Template mapper for service {0} is created.".format(self.service_name))

        return servce_conf_dict



    def generate_template(self):

        self.logger.info("Begin to generate the template file in service {0}'s configuration.".format(self.service_name))

        service_conf_dict = self.template_mapper()

        if "template-list" not in self.service_conf:
            self.logger.warning("There is no template-list in service {0}'s configuration.".format(self.service_name))
            self.logger.warning("Please check the path bootstrap/{0}/service.yaml.".format(self.service_name))
            return

        for template_file in self.service_conf["template-list"]:

            template_path = "bootstrap/{0}/{1}.template".format(self.service_name, template_file)
            target_path = "bootstrap/{0}/{1}".format(self.service_name, template_file)

            self.logger.info("Generate the template file {0}.".format(template_path))
            self.logger.info("Save the generated file to {0}.".format(target_path))

            template_data = file_handler.read_template(template_path)
            try:
                generated_template = template_handler.generate_from_template_dict(template_data, service_conf_dict)
            except Exception as e:
                self.logger.exception("failed to generate template file from %s with dict %s", template_path, service_conf_dict)
                raise e

            file_handler.write_generated_file(target_path,  generated_template)

        self.logger.info("The template file of service {0} is generated.".format(self.service_name))



    def run(self):

        self.generate_template()




