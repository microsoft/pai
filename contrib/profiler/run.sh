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

Python_Version=`python -V 2>&1|awk '{print $2}'|awk -F '.' '{print $1}'`
if [ $Python_Version -eq 3 ];then
    pip install nvidia-ml-py3
elif [ $Python_Version -eq 2 ];then
    pip install nvidia-ml-py2
fi

param_num=$#

container_id=$1
GPU_INDEX=$2
container_pid=0
Host_Docker=Host
if grep -q $container_id /proc/1/cgroup
then
    Host_Docker=Docker
else
    container_pid=`docker inspect -f {{.State.Pid}} $container_id`
fi

Duration=10

Sample_period=0.03
if [ $param_num -ge 3 ];then
    Sample_period=$3
fi

output_dir=./Profiling_dir
if [ $param_num -ge 4 ];then
    output_dir=$4
fi

echo 'container_id:' $container_id
echo 'container_pid:' $container_pid
echo 'sample_period:' $Sample_period
echo 'host_docker:' $Host_Docker
echo 'duration:' $Duration
echo 'output_dir:' $output_dir
echo 'gpu_index:' $GPU_INDEX
exec python profiler.py --container_id $container_id --container_pid $container_pid --sample_period $Sample_period --host_docker $Host_Docker --duration $Duration --output_dir $output_dir --gpu_index $GPU_INDEX
