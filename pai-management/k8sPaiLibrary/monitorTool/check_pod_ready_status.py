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

from ..monitorlib import servicestatus


# Designed for shell, so use the exit function to pass error code.
def service_status_check(label_key, label_value):

    if servicestatus.pod_is_ready_or_not(label_key, label_value) != True:
        print "{0} is not ready yet!".format(label_value)
        sys.exit(1)



def waiting_until_service_ready(label_key, label_value, total_time=216000):

    while servicestatus.pod_is_ready_or_not(label_key, label_value) != True:

        print "{0} is not ready yet. Pleas wait for a moment!".format(label_value)
        time.sleep(10)
        total_time = total_time - 10

        if total_time < 0:
            print "An issue occure when starting up {0}".format(label_value)
            sys.exit(1)

    print "{0} is ready!".format(label_value)



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-w', '--wait_service', action="store_true", help="wait until the service is ready")
    parser.add_argument('-k', '--label-key', dest="label_key", required=True, help="the data of app label-key in your service")
    parser.add_argument('-v', '--label-value', dest="label_value", required=True, help="the data of app label-value in your service")
    parser.add_argument('-t', '--timeout', type=int, default=216000, help="the data of app label in your service")

    args = parser.parse_args()
    service_label_key = args.label_key
    service_label_value = args.label_value

    timeout = args.timeout

    if args.wait_service:
        waiting_until_service_ready(service_label_key, service_label_value, timeout)
    else:
        service_status_check(service_label_key, service_label_value)


if __name__ == "__main__":
    main()
