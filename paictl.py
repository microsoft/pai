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

import time
import os
import sys
import argparse
import logging
import logging.config

from deployment.paiLibrary.common import file_handler


from deployment.checkCmd import CheckCmd
from deployment.configCmd import ConfigCmd
from deployment.layoutCmd import LayoutCmd
from deployment.clusterCmd import ClusterCmd
from deployment.serviceCmd import ServiceCmd
from deployment.machineCmd import MachineCmd
from deployment.utilityCmd import UtilityCmd

logger = logging.getLogger(__name__)


def setup_logging():
    """
    Setup logging configuration.
    """
    configuration_path = "deployment/sysconf/logging.yaml"
    logging_configuration = file_handler.load_yaml_config(configuration_path)
    logging.config.dictConfig(logging_configuration)


def main(args):
    parser = argparse.ArgumentParser()
    sub_parser = parser.add_subparsers(help="paictl operations")

    # create the parser for "layout" command
    layout_parser = sub_parser.add_parser("layout", help="layout tools")
    layout_cmd = LayoutCmd()
    layout_cmd.register(layout_parser)

    # create the parser for "check" command
    check_parser = sub_parser.add_parser("check", help="check PAI status")
    check_cmd = CheckCmd()
    check_cmd.register(check_parser)

    # create the parser for "config" command
    config_parser = sub_parser.add_parser("config")
    config_cmd = ConfigCmd()
    config_cmd.register(config_parser)

    # create the parser for "cluster" command
    cluster_parser = sub_parser.add_parser("cluster")
    cluster_cmd = ClusterCmd()
    cluster_cmd.register(cluster_parser)

    # create the parser for "service" command
    service_parser = sub_parser.add_parser("service")
    service_config = ServiceCmd()
    service_config.register(service_parser)

    # create the parser for "machine" command
    machine_parser = sub_parser.add_parser("machine")
    machine_cmd = MachineCmd()
    machine_cmd.register(machine_parser)

    # create the parser for "utility" command
    utility_parser = sub_parser.add_parser("utility")
    utility_cmd = UtilityCmd()
    utility_cmd.register(utility_parser)

    # execute the command: call the "handler" with parsed arguments
    parserd = parser.parse_args(args)
    parserd.handler(parserd)


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.realpath(__file__))
    os.chdir(script_dir)

    setup_logging()
    main(sys.argv[1:])

