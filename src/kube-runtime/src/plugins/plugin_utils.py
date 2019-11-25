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

import logging
import argparse
import yaml

logger = logging.getLogger(__name__)

def plugin_init():
    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )
    parser = argparse.ArgumentParser()
    parser.add_argument("parameters", help="parameters for runtime plugin in yaml")
    parser.add_argument("pre_script", help="script for pre commands")
    parser.add_argument("post_script", help="script for post commands")
    args = parser.parse_args()

    parameters = yaml.load(args.parameters, Loader=yaml.SafeLoader)

    return [parameters, args.pre_script, args.post_script]

def inject_commands(commands, script):
    if commands is not None and len(commands) > 0:
        new_commands = [x+"\n" for x in commands]
        with open(script, 'a+') as f:
            f.writelines(new_commands)


if __name__ == "__main__":
    input_data = plugin_init()
    logger.info(input_data)
