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
    args = parser.parse_args()

    parameters = yaml.load(args.parameters)
    if parameters is not None:
        with open(args.pre_script, 'a+') as f:
            logdir = ",".join(["{}:{}".format(k, v) for k, v in parameters["logdir"].items()])
            f.write("tensorboard --logdir={} --port={} &\n".format(logdir, parameters["port"]))

