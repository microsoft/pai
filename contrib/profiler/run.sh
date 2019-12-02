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

case $1 in
  -h|--help)
    echo "usage: run.sh [-t      The duration of the profiler]"
    exit 0
    ;;
esac

# Install NFS
apt update

pip install --upgrade pip
#PYTHON_VERSION=`python -V 2>&1|awk '{print $2}'|awk -F '.' '{print $1}'`
PYTHON_VERSION=`pip -V 2>&1 | awk '{print $6}' | awk -F '.' '{print $1}'`
if [ $PYTHON_VERSION -eq 3 ];then
    pip install nvidia-ml-py3
elif [ $PYTHON_VERSION -eq 2 ];then
    pip install nvidia-ml-py
fi
pip install numpy
pip install pandas
pip install matplotlib

OUTPUT_DIR=/usr/local/pai/logs/${FC_POD_UID}
CONTAINER_ID="Self"
SAMPLE_PERIOD=0.02
ANALYZE_PERIOD=10
DURATION=-1
HOST_DOCKER=Host
CONTAINER_PID=-1
while getopts "t:" OPT;do
  case $OPT in
  t)
    # -t:The duration of the profiler
    DURATION=$OPTARG
  esac
done

echo 'container_id:' $CONTAINER_ID
echo 'container_pid:' $CONTAINER_PID
echo 'sample_period:' $SAMPLE_PERIOD's'
echo 'analyze_period:' $ANALYZE_PERIOD's'
echo 'platform:' $HOST_DOCKER
echo 'duration:' $DURATION
echo 'output_dir:' $OUTPUT_DIR
echo 'gpu_index:' $GPU_INDEX

if [ $PYTHON_VERSION -eq 3 ];then
  exec nohup python3 -u `dirname $0`/profiler.py --container_id $CONTAINER_ID --container_pid $CONTAINER_PID --sample_period $SAMPLE_PERIOD --analyze_period $ANALYZE_PERIOD --output_dir $OUTPUT_DIR --duration_time $DURATION >$OUTPUT_DIR/log.txt 2>&1 &
elif [ $PYTHON_VERSION -eq 2 ];then
  exec nohup python -u `dirname $0`/profiler.py --container_id $CONTAINER_ID --container_pid $CONTAINER_PID --sample_period $SAMPLE_PERIOD --analyze_period $ANALYZE_PERIOD --output_dir $OUTPUT_DIR --duration_time $DURATION >$OUTPUT_DIR/log.txt 2>&1 &
fi
