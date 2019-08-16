#! /bin/bash

pip install nvidia-ml-py3

param_num=$#

container_id=$1
GPU_INDEX=$2
container_pid=`docker inspect -f {{.State.Pid}} $container_id`

Host_Docker=Host
if grep -wq $container_id /proc/1/cgroup
then
    Host_Docker=Docker
fi

Duration=10

output_dir=./Profiling_dir
if [ $param_num -ge 4 ];then
    output_dir=$4
fi

Sample_period=0.03
if [ $param_num -ge 3 ];then
    Sample_period=$3
fi

echo 'container_id:' $container_id
echo 'container_pid:' $container_pid
echo 'Sample_period:' $Sample_period
echo 'Host_Docker:' $Host_Docker
echo 'Duration:' $Duration
echo 'output_dir:' $output_dir
echo 'GPU_INDEX:' $GPU_INDEX
exec python Profiler.py --container_id $container_id --container_pid $container_pid --Sample_period $Sample_period --Host_Docker $Host_Docker --Duration $Duration --output_dir $output_dir --GPU_INDEX $GPU_INDEX
