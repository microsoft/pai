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


from ..common import template_handler
from ..common import file_handler




class service_template_generate:


    def __init__(self, cluster_object_model, service_name, service_conf):

        self.cluster_object_mode = cluster_object_model
        self.service_name = service_name
        self.service_conf = service_conf



    def template_mapper(self):

        ### Todo: read configuration from service.yaml?

        servce_conf_dict = {
            "clusterinfo": self.cluster_object_mode['clusterinfo'],
            "machineinfo": self.cluster_object_mode["machineinfo"],
            "machinelist": self.cluster_object_mode["machinelist"]
        }

        return servce_conf_dict



    def generate_template(self):

        service_conf_dict = self.template_mapper()

        if "template-list" not in self.service_conf:
            return

        for template_file in self.service_conf["template-list"]:
            template_path = "bootstrap/{0}/{1}.template".format(self.service_name, template_file)
            target_path = "bootstrap/{0}/{1}".format(self.service_name, template_file)

            template_data = file_handler.read_template(template_path)
            generated_template = template_handler.generate_from_template_dict(template_data, service_conf_dict)
            file_handler.write_generated_file(target_path,  generated_template)




