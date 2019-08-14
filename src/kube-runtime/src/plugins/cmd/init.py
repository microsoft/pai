#!/usr/local/bin/python

from __future__ import print_function

import os
import sys
import collections
import logging
import argparse
import yaml

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )
    parser = argparse.ArgumentParser()
    parser.add_argument("parameters", help="parameters for sshd plugin in yaml")
    parser.add_argument("pre_script", help="pre script")
    parser.add_argument("post_script", help="post script")
    args = parser.parse_args()

    parameters = yaml.load(args.parameters)
    if parameters is not None:
        if "precommands" in parameters:
            with open(args.pre_script, 'a+') as f:
                for cmd in parameters["precommands"]:
                    f.write("{}\n".format(cmd))
        if "postcommands" in parameters:
            with open(args.post_script, 'a+') as f:
                for cmd in parameters["postcommands"]:
                    f.write("{}\n".format(cmd))
