#!/usr/bin/python

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

import argparse
import logging
import os
import sys
import shutil
import yaml

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import common.utils as utils  # pylint: disable=wrong-import-position

LOGGER = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("job_config", help="job config yaml")
    parser.add_argument("source_folder", help="dependency source folder")
    parser.add_argument("target_folder", help="dependency target folder")
    args = parser.parse_args()

    if os.path.exists(args.target_folder) is False:
        os.makedirs(args.target_folder)

    LOGGER.info("get job config from %s", args.job_config)
    with open(args.job_config) as config:
        job_config = yaml.safe_load(config)

    dependency_names = os.listdir(args.source_folder)
    need_names = []
    if 'extras' in job_config and 'com.microsoft.pai.runtimeplugin' in job_config['extras']:
        plugins = job_config['extras']['com.microsoft.pai.runtimeplugin']
        for plugin in plugins:
            if plugin['plugin'] == 'ssh':
                need_names.extend([name for name in dependency_names if name.startswith('ssh-')])
            elif plugin['plugin'] == 'teamwise_storage':
                need_names.extend([name for name in dependency_names if name.startswith('nfs-')])
                need_names.extend([name for name in dependency_names if name.startswith('samba-')])
                need_names.extend([name for name in dependency_names if name.startswith('azurefile-')])
                need_names.extend([name for name in dependency_names if name.startswith('azureblob-')])
    need_names = list(set(need_names))
    for name in need_names:
        name_source_folder = os.path.join(args.source_folder, name)
        name_target_folder = os.path.join(args.target_folder, name)
        LOGGER.info('add dependency from %s to %s', name_source_folder, name_target_folder)
        shutil.copytree(name_source_folder, name_target_folder)


if __name__ == "__main__":
    utils.init_logger()
    main()
