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
    args = parser.parse_args()

    parameters = yaml.load(args.parameters)
    if parameters is not None and "userssh" in parameters:
        # export PAI_SSH_PUB_KEY for sshd.sh to use
        with open("/usr/local/pai/runtime.d/runtime_env.sh", 'a+') as f: 
            f.write("export {}='{}'\n".format("PAI_SSH_PUB_KEY", parameters["userssh"]))
