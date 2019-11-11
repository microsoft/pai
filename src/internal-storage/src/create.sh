#!/bin/bash

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
cd /paiInternal

if [ -f storage.ext4 ]; then
    echo "Skip storage.ext4 creation."
else
    echo "Creating storage.ext4 of ${QUOTA_GB}G, please wait..."
    fallocate -l ${QUOTA_GB}G storage.ext4 || { echo "allocation failed!"; sleep infinity; }
    /sbin/mkfs -t ext4 -q storage.ext4 -F
fi

ls READY &> /dev/null

if [ $? -ne 0 ]; then
    if [ -d storage ]; then
        umount storage
    else
        mkdir -p storage
    fi
    mount -o loop,rw,usrquota,grpquota storage.ext4 storage || { echo "mount failed!"; sleep infinity; }
    touch storage/READY
fi

sleep 30m

while true; do
    ls READY &> /dev/null
    if [ $? -ne 0 ]; then
        echo "Cannot find storage/READY! Abort."
        exit 1
    fi
    if [ ! -f storage.ext4 ]; then
        echo "Cannot find storage.ext4! Abort."
        exit 1
    fi
    sleep 1m
done


