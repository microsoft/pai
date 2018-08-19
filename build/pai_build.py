from __future__ import absolute_import
from __future__ import print_function

import os
import sys
import argparse
from six import text_type


def help():
    print ("no command.")


def main():
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
        help='TODO'
    )

    parser.add_argument(
        '-s', '--service',
        type=text_type,
        default='all',
        help="TODO"
    )

    parser.add_argument(
        '-i', '--imagelist',
        type=text_type,
        default='all',
        help="TODO"
    )

    args = parser.parse_args()

    if args.push:
        print ("In Push", args.imagelist)
    
    elif args.build:
        print ('In Build:', args.service)

    else:
        raise ValueError()

    print (args)
        


if __name__ == "__main__":
    main()