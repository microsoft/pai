#!/usr/bin/python

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
    args = parser.parse_args()

    parameters = yaml.load(args.parameters)
    with open(args.pre_script, 'a+') as f:
        if parameters is not None and "userssh" in parameters:
            # export PAI_SSH_PUB_KEY for sshd.sh to use
            f.write("export PAI_SSH_PUB_KEY='{}'\n".format(parameters["userssh"]))
        # write call to real executable script
        f.write("{}/sshd.sh\n".format(os.path.split(os.path.realpath(__file__))[0]))
