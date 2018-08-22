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


mnt_point=/mnt/hdfs
hdfs_addr=$(sed -e "s@hdfs://\(\([0-9]\{1,3\}\.\)\{3\}[0-9]\{1,3\}:[0-9]\{1,5\}\).*@\1@" <<< $PAI_DATA_DIR)

mkdir -p $mnt_point
hdfs-mount $hdfs_addr $mnt_point &
export DATA_DIR=$(sed -e "s@hdfs://\([0-9]\{1,3\}\.\)\{3\}[0-9]\{1,3\}:[0-9]\{1,5\}@$mnt_point@g" <<< $PAI_DATA_DIR)
export OUTPUT_DIR=$(sed -e "s@hdfs://\([0-9]\{1,3\}\.\)\{3\}[0-9]\{1,3\}:[0-9]\{1,5\}@$mnt_point@g" <<< $PAI_OUTPUT_DIR)

sed -i "/stderr/s/^/# /" G2P.cntk
sed -i "/maxEpochs/c\maxEpochs = 1" G2P.cntk
cntk configFile=G2P.cntk DataDir=$DATA_DIR OutDir=$OUTPUT_DIR