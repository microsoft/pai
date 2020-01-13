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
import re
import sys

import pystache
import yaml

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common.utils import init_logger  #pylint: disable=wrong-import-position

LOGGER = logging.getLogger(__name__)


def _convert_to_dict(obj) -> dict:
    converted_obj = {}
    if isinstance(obj, list):
        for i, value in enumerate(obj):
            converted_obj[str(i)] = value
    elif isinstance(obj, dict):
        for key, value in obj.items():
            converted_obj[key] = _convert_to_dict(value)
    else:
        converted_obj = obj
    return converted_obj


def _render_user_command(user_command, secrets) -> str:
    if not secrets:
        return user_command
    LOGGER.info("not rendered user command is %s", user_command)
    secret_dict = _convert_to_dict(secrets)
    parsed = pystache.parse(user_command, delimiters=("<%", "%>"))
    for token in parsed._parse_tree:  #pylint: disable=protected-access
        if isinstance(token, pystache.parser._EscapeNode):  #pylint: disable=protected-access
            token.key = re.sub(
                r"\[(\d+)\]", r".\1",
                token.key)  # make format such as $secrets.data[0] works
    return pystache.Renderer().render(parsed, {"$secrets": secret_dict})


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
    rendered_user_command = _render_user_command(user_command, secrets)
    _output_user_command(rendered_user_command, args.output_file)
    logging.info("User command already rendered and outputted to %s",
                 args.output_file)


if __name__ == "__main__":
    init_logger()
    main()
