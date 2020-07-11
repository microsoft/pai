#!/usr/bin/env python

import os
import datetime
import yaml
import logging.config
import argparse

logger = logging.getLogger(__name__)

TEMPORARY_DIR_NAME = ".azure_quick_start"

def load_yaml_config(config_path):
    with open(config_path, "r") as f:
        config_data = yaml.load(f, yaml.SafeLoader)
    return config_data

def create_folder_if_not_exist(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def main():
    parser = argparse.ArgumentParser(description="OpenPAI at Azure quick start")

    starttime = datetime.datetime.now()
    logger.info("Start to deploy azure {0}".format(starttime))

    parser.add_argument(
        '-c', '--config',
        type=bytes,
        required=True,
        help='The path of your configuration path.'
    )

    args = parser.parse_args()
    config_path = args.config




if __name__ == "__main__":
    main()

