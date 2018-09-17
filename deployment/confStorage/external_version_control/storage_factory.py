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
import sys
import yaml
import logging
import logging.config

from .local_storage import local_storage



logger = logging.getLogger(__name__)

package_directory_kubeinstall = os.path.dirname(os.path.abspath(__file__))
conf_storage_path = "{0}/../../sysconf/conf_external_storage.yaml"



def load_yaml_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f)

    return cluster_data



def get_external_storage(storage_configuration_path = None):

    if storage_configuration_path == None:
        storage_configuration_path = conf_storage_path
    storage_conf = load_yaml_config(conf_storage_path)

    if storage_conf["type"] == "git":
        return local_storage(storage_conf)
    elif storage_conf["type"] == "local":
        pass
    else:
        logger.error("External Storage Type [ {0} ] is not supported yet.".format(storage_conf["type"]))
        sys.exit(1)









