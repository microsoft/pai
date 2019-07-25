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

from __future__ import print_function

import os
import sys
import socket


def check_port(portno):
    """Check whether the port is in use.

    Exit with code 200 if the port is already in use.

    Args:
        portno: Port number to check.
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    ret = sock.connect_ex(('localhost', portno))
    sock.close()
    if ret == 0:
        print("Port {} has conflict.".format(portno))
        sys.exit(200)


def main():
    """Main function.

    Check whether there's conflict in scheduled ports.
    """
    port_list = os.environ.get("PAI_CONTAINER_HOST_PORT_LIST")
    if port_list:
        for each in port_list.split(";"):
            portno_list = each.split(":")
            if len(portno_list) > 1:
                for portno in portno_list[1].split(","):
                    check_port(int(portno))


if __name__ == "__main__":
    main()
