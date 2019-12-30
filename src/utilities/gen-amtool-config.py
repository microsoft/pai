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
import codecs
import os
import sys

project_root = os.path.join(os.path.dirname(os.path.realpath(__file__)), "..")

sys.path.append(os.path.join(project_root, "pai-management"))

from paiLibrary.clusterObjectModel import objectModelFactory

amtool_config = """
# see https://github.com/prometheus/alertmanager#config for detail
# Define the path that amtool can find your `alertmanager` instance at
alertmanager.url: "http://{}:{}"

# Override the default author. (unset defaults to your username)
# author: me@example.com

# Force amtool to give you an error if you don't include a comment on a silence
comment_required: true

# Set a default output format. (unset defaults to simple)
output: extended
"""

def gen_amtool_config(args):
    model = objectModelFactory.objectModelFactory(args.config_path)
    service_config = model.objectModelPipeLine()

    try:
        prometheus_info = service_config["service"]["clusterinfo"]["prometheusinfo"]
        alerting = prometheus_info["alerting"]
        port = alerting["alert_manager_port"]
        alert_manager_hosts = alerting["alert-manager-hosts"]
        host = alert_manager_hosts[0] # TODO not sure if alert manager with HA workds this way
    except KeyError:
        sys.stderr.write("no alert manager configured\n")
        sys.exit(1)

    home = os.path.expanduser("~")
    amtool_dir = os.path.join(home, ".config/amtool")
    if not os.path.exists(amtool_dir):
        os.makedirs(amtool_dir)
    config = os.path.join(amtool_dir, "config.yml")
    if os.path.isfile(config) and not args.force:
        sys.stderr.write("{} already exist, specify -f to overwrite\n".format(config))
        sys.exit(1)

    with codecs.open(config, "w", "utf-8") as f:
        f.write(amtool_config.format(host,port))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--config-path", dest="config_path", required=True,
            help="The path of your configuration directory.")
    parser.add_argument("-f", "--force", dest="force", default=False, action="store_true",
            help="clean all the data forcefully")
    args = parser.parse_args()

    gen_amtool_config(args)
