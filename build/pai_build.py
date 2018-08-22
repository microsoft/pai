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

from __future__ import absolute_import
from __future__ import print_function

from core import build_center
from model import config_model

import os
import sys
import argparse
import datetime
import logging
import logging.config

logger = logging.getLogger(__name__)

def setup_logging():
    """
    Setup logging configuration.
    """
    logger.setLevel(logging.DEBUG)
    consoleHandler = logging.StreamHandler()
    consoleHandler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    consoleHandler.setFormatter(formatter)
    logger.addHandler(consoleHandler)

def load_build_config(config_dir):
    buildConfig = config_model.ConfigModel(config_dir)
    configModel = buildConfig.build_config_parse()
    return configModel

def build_service(args,config_model):
    pai_build = build_center.BuildCenter(config_model,args.service)
    pai_build.build_center()

def push_image(args,config_model):
    pai_push = build_center.BuildCenter(config_model,args.imagelist)
    pai_push.push_center()

def main():

    # Define execution path to root folder
    scriptFolder=os.path.dirname(os.path.realpath(__file__))
    os.chdir(os.path.dirname(scriptFolder))

    starttime = datetime.datetime.now()
    parser = argparse.ArgumentParser(description="pai build client")
    logger.info("Pai build starts at {0}".format(starttime))

    subparsers = parser.add_subparsers(help='build service cli')

    # Build commands
    build_parser = subparsers.add_parser('build',help='build service cli')
    build_parser.add_argument(
        '-c', '--config',
        type=bytes,
        required=True,
        help='The path of your configuration directory.'
    )
    build_parser.add_argument(
        '-s', '--service',
        type=bytes,
        nargs='+',
        help="The service list you want to build"
    )
    build_parser.set_defaults(func = build_service)

    # Push commands
    push_parser = subparsers.add_parser('push',help='push image cli')
    push_parser.add_argument(
        '-c', '--config',
        type=bytes,
        required=True,
        help='The path of your configuration directory.'
    )
    push_parser.add_argument(
        '-i', '--imagelist',
        type=bytes,
        nargs='+',
        help="The image list you want to push"
    )
    push_parser.set_defaults(func = push_image)

    args = parser.parse_args()
    config_model = load_build_config(args.config)
    args.func(args, config_model)

    endtime = datetime.datetime.now()
    logger.info("Pai build ends at {0}".format(endtime))
    logger.info("Pai build costs {0}".format(endtime - starttime))

if __name__ == "__main__":
    setup_logging()
    main()
