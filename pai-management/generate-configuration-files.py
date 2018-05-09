#!/usr/bin/env python

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

from __future__ import print_function
#
import os
import sys
import yaml
import jinja2
import argparse

#

def create_parser():
    #
    desc  = "Automatically generate the following configuration files from a machine list\n"
    desc += "in csv format:\n"
    desc += "\n"
    desc += "    * Machine-level configurations: cluster-configuration.yaml\n"
    desc += "    * Kubernetes-level configurations I: kubernetes-configuration.yaml\n"
    desc += "    * Kubernetes-level configurations II: k8s-role-definition.yaml\n"
    desc += "    * Service-level configurations: service-configuration.yaml\n"
    desc += "\n"
    parser = argparse.ArgumentParser(
        description=desc,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    #
    g = parser.add_mutually_exclusive_group(required=True)
    g.add_argument(
        "--machine-list", default=None,
        help="comma-separated list of IP addresses of machines.")
    g.add_argument(
        "--machine-list-file", default=None,
        help="list of IP addresses of machines in CSV format.")
    #
    return parser

#

if __name__ == "__main__":
    #
    parser = create_parser()
    args = parser.parse_args()
    #
    machines = []
    if args.machine_list is not None:
        machines = args.machine_list.split(",")
    elif args.machine_list_file is not None:
        for line in open(args.machine_list_file, "r"):
            machines.append(line.strip())
    print(machines)
    #
    template_string = open('./templates/cluster-configuration.yaml.template', 'r').read()
    env = {
        "machines": machines
    }
    rendered_string = jinja2.Template(template_string).render(env)
    print(rendered_string)


#

#END
