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


# Example script for distributed CNTK job

trap "kill 0" EXIT

# hdfs address in IP:PORT format
hdfs_addr=$(sed -e "s@hdfs://@@g" <<< $PAI_DEFAULT_FS_URI)

# hdfs mount point
mnt_point=/mnt/hdfs

# mount hdfs as a local file system
mkdir -p $mnt_point
hdfs-mount $hdfs_addr $mnt_point &
export DATA_DIR=$(sed -e "s@$PAI_DEFAULT_FS_URI@$mnt_point@g" <<< $PAI_DATA_DIR)
export OUTPUT_DIR=$(sed -e "s@$PAI_DEFAULT_FS_URI@$mnt_point@g" <<< $PAI_OUTPUT_DIR)


# prepare CNTK distributed BrainScript and upload to hdfs
# please refer to CNTK G2P example and brainscript parallel training docs for details
# https://github.com/Microsoft/CNTK/tree/master/Examples/SequenceToSequence/CMUDict/BrainScript
# https://docs.microsoft.com/en-us/cognitive-toolkit/Multiple-GPUs-and-machines#3-configuring-parallel-training-in-cntk-in-brainscript
cntk configFile=g2p-distributed.cntk parallelTrain=true DataDir=$DATA_DIR OutDir=$OUTPUT_DIR
