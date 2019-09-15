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


def get_file_list_in_path(path):

    return next(os.walk(path))[2]



def load_yaml_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f, yaml.SafeLoader)

    return cluster_data


def dump_yaml_data(file_path, data):
    with open(file_path, "w") as f:
        yaml.dump(data, f, default_flow_style=False)



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

    if file_exist_or_not(file_path):
        try:
            os.unlink(file_path)
        except OSError as e:
            logger.exception(e)



def directory_exits(dir_path):

    return os.path.isdir(dir_path)




def create_folder_if_not_exist(folder_path):
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
