from __future__ import absolute_import
from __future__ import print_function


from model import config_model

import os
import sys
import argparse
import datetime
import logging
import logging.config

import build_center

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

def main():

    # Define execution path to root folder
    scriptFolder=os.path.dirname(os.path.realpath(__file__))
    os.chdir(os.path.dirname(scriptFolder))

    starttime = datetime.datetime.now()
    parser = argparse.ArgumentParser(description="pai build client")
    logger.info("Pai build starts at {0}".format(starttime))

    # setup commands
    command = parser.add_mutually_exclusive_group()
    command.add_argument(
        '-b', '--build',
        action='store_true',
        help="Build"
    )
    command.add_argument(
        '-p', '--push',
        action='store_true',
        help="Push"
    )

    # setup arguments
    parser.add_argument(
        '-c', '--config',
        type=bytes,
        required=True,
        help='The path of your configuration directory.'
    )

    parser.add_argument(
        '-s', '--service',
        type=bytes,
        nargs='+',
        help="Build service list"
    )

    parser.add_argument(
        '-i', '--imagelist',
        type=bytes,
        nargs='+',
        help="Push image list"
    )


    args = parser.parse_args()

    # TO-DO add config dir check
    config_model = load_build_config(args.config)

    if args.push:
        pai_push = build_center.BuildCenter(config_model,args.imagelist)
        pai_push.push_center()

    elif args.build:
        pai_build = build_center.BuildCenter(config_model,args.service)
        pai_build.build_center()

    else:
        parser.exit(1, parser.format_help())

    endtime = datetime.datetime.now()
    logger.info("Pai build ends at {0}".format(endtime))
    logger.info("Pai build costs {0}".format(endtime - starttime))

if __name__ == "__main__":
    setup_logging()
    main()
