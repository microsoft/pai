from __future__ import absolute_import
from __future__ import print_function


from model import config_model

import os
import sys
import argparse
import datetime
import build_center
from six import text_type

def load_build_config(config_dir):
    buildConfig = config_model.ConfigModel(config_dir)
    configModel = buildConfig.build_config_parse()
    return configModel

def main():

    # Define execution path to root folder
    scriptFolder=os.path.dirname(os.path.realpath(__file__))
    os.chdir(os.path.dirname(scriptFolder))

    starttime = datetime.datetime.now()
    parser = argparse.ArgumentParser(description="TODO:pai build cli.")

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
        type=text_type,
        required=True,
        help='The path of your configuration directory.'
    )

    parser.add_argument(
        '-s', '--service',
        type=text_type,
        nargs='+',
        help="Build service list"
    )

    parser.add_argument(
        '-i', '--imagelist',
        type=text_type,
        nargs='+',
        help="Push image list"
    )


    args = parser.parse_args()

    # TO-DO add config dir check
    config_model = load_build_config(args.config)

    if args.push:
        print ("In Push", args.imagelist)
        pai_push = build_center.BuildCenter(config_model,args.imagelist)
        pai_push.push_center()

    elif args.build:
        print ('In Build:', args.service)
        pai_build = build_center.BuildCenter(config_model,args.service)
        pai_build.build_center()

    else:
        parser.exit(1, parser.format_help())

    endtime = datetime.datetime.now()
    print("start time=" + str(starttime))
    print("end time=" + str(endtime))
    print (endtime - starttime)

if __name__ == "__main__":
    main()
