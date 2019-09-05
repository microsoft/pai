#! /bin/bash
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

PYTHON_VERSION=`python -V 2>&1|awk '{print $2}'|awk -F '.' '{print $1}'`
if [ $PYTHON_VERSION -eq 3 ];then
    pip install nvidia-ml-py3
elif [ $PYTHON_VERSION -eq 2 ];then
    pip install nvidia-ml-py
fi

param_num=$#

CONTAINER_ID=$1
GPU_INDEX=$2
CONTAINER_PID=-1
HOST_DOCKER=Host
if grep -q $CONTAINER_ID /proc/1/cgroup
then
    HOST_DOCKER=Docker
else
    CONTAINER_PID=`docker inspect -f {{.State.Pid}} $CONTAINER_ID`
fi

SAMPLE_PERIOD=0.03
if [ $param_num -ge 3 ];then
    SAMPLE_PERIOD=$3
fi

OUTPUT_DIR=./Profiling_dir
if [ $param_num -ge 4 ];then
    OUTPUT_DIR=$4
fi

DURATION=10
if [ $param_num -ge 5 ];then
    DURATION=$5
fi

echo 'container_id:' $CONTAINER_ID
echo 'container_pid:' $CONTAINER_PID
echo 'sample_period:' $SAMPLE_PERIOD
echo 'platform:' $HOST_DOCKER
echo 'duration:' $DURATION
echo 'output_dir:' $OUTPUT_DIR
echo 'gpu_index:' $GPU_INDEX
exec python profiler.py --container_id $CONTAINER_ID --container_pid $CONTAINER_PID --sample_period $SAMPLE_PERIOD --analyze_period 10 --duration $DURATION --output_dir $OUTPUT_DIR --gpu_index $GPU_INDEX
