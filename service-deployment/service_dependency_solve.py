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

import argparse
import sys
import time
from kubernetesTool import servicestatus


# Designed for shell, so use the exit function to pass error code.
def service_status_check(servicename):

    if servicestatus.is_service_ready(servicename) != True:
        print "{0} is not ready yet!".format(servicename)
        sys.exit(1)



def waiting_until_service_ready(servicename, total_time=216000):

    while servicestatus.is_service_ready(servicename) != True:

        print "{0} is not ready yet. Pleas wait for a moment!".format(servicename)
        time.sleep(10)
        total_time = total_time - 10

        if total_time < 0:
            print "An issue occure when starting up {0}".format(servicename)
            sys.exit(1)

    print "{0} is ready!".format(servicename)



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-w', '--wait_service', action="store_true", help="wait until the service is ready")
    parser.add_argument('-s', '--service', required=True, help="the data of app label in your service")
    parser.add_argument('-t', '--timeout', type=int, default=216000, help="the data of app label in your service")

    args = parser.parse_args()
    app_service_name = args.service

    timeout = args.timeout

    if args.wait_service:
        waiting_until_service_ready(app_service_name, timeout)
    else:
        service_status_check(app_service_name)


if __name__ == "__main__":
    main()
