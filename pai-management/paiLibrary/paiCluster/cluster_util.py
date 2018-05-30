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
from paiLibrary.common import file_handler
from paiLibrary.common import template_handler
from k8sPaiLibrary import maintainlib
import importlib
from k8sPaiLibrary.maintainlib import common as pai_common


logger = logging.getLogger(__name__)

def maintain_cluster_k8s(cluster_config, **kwargs):
    module_name = "k8sPaiLibrary.maintainlib.{0}".format(kwargs["option_name"])
    module = importlib.import_module(module_name)

    job_class = getattr(module, kwargs["option_name"])
    job_instance = job_class(cluster_config, **kwargs)

    job_instance.run()


def generate_configuration(quick_start_config_file, configuration_directory, force):
    """Automatically generate the following configuration files from a quick-start file:
        * Machine-level configurations: cluster-configuration.yaml
        * Kubernetes-level configurations I: kubernetes-configuration.yaml
        * Kubernetes-level configurations II: k8s-role-definition.yaml
        * Service-level configurations: service-configuration.yaml
    """
    quick_start_config = file_handler.load_yaml_config(quick_start_config_file)
    #
    target_file_names = [
        "cluster-configuration.yaml",
        "kubernetes-configuration.yaml",
        "k8s-role-definition.yaml",
        "services-configuration.yaml"
    ]
    for x in target_file_names:
        target_file_path = os.path.join(configuration_directory, x)
        if file_handler.file_exist_or_not(target_file_path) and force is False:
            print("File %s exists. Skip." % (target_file_path))
            pass
        else:
            file_handler.create_folder_if_not_exist(configuration_directory)
            file_handler.write_generated_file(
                target_file_path,
                template_handler.generate_from_template_dict(
                    file_handler.read_template("./templates/%s.template" % (x)),
                    { "env": quick_start_config }))
