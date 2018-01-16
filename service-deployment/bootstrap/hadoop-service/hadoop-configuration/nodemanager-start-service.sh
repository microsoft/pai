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

# If docker needn't, pls remove them
cp -r docker/* /usr/bin/
docker &
docker run hello-world
###


## GPU test
driverpath="/var/drivers/nvidia/current"
ls -A $driverpath
if [ "`ls -A $driverpath`" = "" ]
then
  echo no gpu
  $HADOOP_YARN_HOME/bin/yarn nodemanager
else
  echo gpu machine

  # The loop is designed for the node restart or kubelet restart.
  # Because when kubelet crushed, all service in the node will be started at the same time.
  # Usually drivers' startup process is much slower than node-manager.
  # So set the try times to 10. If after 10 time retris, the nm service still can't find gpu.
  # Please check the node status.
  for (( i=1; i<=10; i++ ))
  do

    if nvidia-smi
    then
      echo GPUs are found.
      break
    fi

    sleep 60

  done


  $HADOOP_YARN_HOME/bin/yarn nodemanager
fi



