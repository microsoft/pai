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

#!/bin/bash

# This scripts leverage the lsof command and filters the result to get the list of files which has been opened by
# a process but the file is deleted later. The output of the deleted file list is like:
# COMMAND    PID USER   FD   TYPE DEVICE SIZE/OFF NLINK     NODE NAME
# dhclient  1008 root  txt    REG    8,1   487248     0 12320783 /sbin/dhclient (deleted)
# python   31848 root    3w   REG    8,1        0     0 29362883 /tmp/tmp_out.txt (deleted)
#
# We only retrieve the PID (second column) and NAME (10th column).

lsof +L1 | awk '{print $2, $10}'
