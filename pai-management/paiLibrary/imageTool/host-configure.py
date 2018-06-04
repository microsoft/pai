#!/usr/bin/env python

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

import yaml
import os
import sys
import subprocess
import jinja2
import argparse



def load_yaml_config(config_path):

    with open(config_path, "r") as f:
        cluster_data = yaml.load(f)

    return cluster_data



def read_template(template_path):

    with open(template_path, "r") as f:
        template_data = f.read()

    return template_data



def generate_from_template(template_data, cluster_config, hostname):

    generated_file = jinja2.Template(template_data).render(
        {
            "host_config": cluster_config[ hostname ],
            "cluster_config": cluster_config
        }
    )

    return generated_file



def write_generated_file(file_path, content_data):

    with open(file_path, "w+") as fout:
        fout.write(content_data)





def main():
    parser = argparse.ArgumentParser()

    parser.add_argument('-c', '--clusterconfig', required=True, help="cluster configuration's path")
    parser.add_argument('-f', '--targetfile', required=True, help="target file's path")
    parser.add_argument('-n', '--hostname', required=True, help="the host's hostname")

    args = parser.parse_args()

    config_path = args.clusterconfig
    target_path = args.targetfile
    hostname = args.hostname

    cluster_config = load_yaml_config(config_path)

    target_file_origin = read_template(target_path)
    target_file_latest = generate_from_template(target_file_origin, cluster_config, hostname)
    write_generated_file(target_path, target_file_latest)



if __name__ == "__main__":
    main()