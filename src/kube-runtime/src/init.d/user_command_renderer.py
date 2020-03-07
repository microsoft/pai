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

import yaml

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common.utils import init_logger, render_string_with_secrets  #pylint: disable=wrong-import-position

LOGGER = logging.getLogger(__name__)


def _output_user_command(user_command, output_file):
    with open(output_file, "w+") as f:
        f.write(user_command)


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("secret_file", help="file which contains secret info")
    parser.add_argument("output_file", help="output file name")
    args = parser.parse_args()

    logging.info("Starting to render user command")
    if not os.path.isfile(args.secret_file):
        secrets = None
    else:
        with open(args.secret_file) as f:
            secrets = yaml.safe_load(f.read())

    user_command = os.getenv("USER_CMD")
    LOGGER.info("not rendered user command is %s", user_command)
    rendered_user_command = render_string_with_secrets(user_command, secrets)
    _output_user_command(rendered_user_command, args.output_file)
    logging.info("User command already rendered and outputted to %s",
                 args.output_file)


if __name__ == "__main__":
    init_logger()
    main()
