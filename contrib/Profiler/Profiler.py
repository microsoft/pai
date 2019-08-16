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


"""
Performance_Profiler is used to profile the using information of the hardware while a deep learing model is running
"""
from pynvml import *
import glob
import csv
import os
import time
import argparse


class Sample:
    def __init__(self, cpu_usage, gpu_usage, mem_used, mem_total, gpu_mem_used, gpu_mem_total, read_bytes, write_bytes,
                 network_receive, network_transmit):
        self._cpu_usage = cpu_usage
        self._gpu_usage = gpu_usage
        self._mem_used = mem_used
        self._mem_total = mem_total
        self._gpu_mem_used = gpu_mem_used
        self._gpu_men_total = gpu_mem_total
        self._read_bytes = read_bytes
        self._write_bytes = write_bytes
        self._network_receive = network_receive
        self._network_transmit = network_transmit


# To get the CPU running time of system from being booted
def getSystemCPUTicks():
    with open('/proc/stat', 'r') as f:
        for line in f.readlines():
            if line.startswith("cpu "):
                items = line.split()
                if len(items) < 8:
                    return -1

                totalClockTicks = 0
                for item in items[1:8]:
                    totalClockTicks += int(item)
                return totalClockTicks
    return -1


# To get the CPU running time of container from being booted
def getContainerCPUTicks(filelist):
    # docker_cpu_path = "/sys/fs/cgroup/cpuacct/docker/" + str(container_id) + "*/cpuacct.stat"
    user_time = 0
    system_time = 0
    for filename in filelist:
        with open(filename, 'r') as f:
            for line in f:
                items = line.split()
                if len(items) != 2:
                    return -1
                if items[0] == 'user':
                    user_time = int(items[1])
                elif items[1] == 'system':
                    system_time = int(items[1])
            return user_time + system_time
    return user_time + system_time


def getCPUPercent(filelist, period):
    sys_ticks = getSystemCPUTicks()
    container_ticks = getContainerCPUTicks(filelist)
    time.sleep(period)

    onlineCPUs = os.sysconf(os.sysconf_names['SC_NPROCESSORS_ONLN'])
    sysDelta = getSystemCPUTicks() - sys_ticks
    containerDelta = getContainerCPUTicks(filelist) - container_ticks

    cpuPercent = (containerDelta * 1.0) / sysDelta * onlineCPUs * 100.0
    # return cpuPercent
    return [containerDelta, sysDelta, onlineCPUs, cpuPercent]


def getGpuUtilization(gpu_idx):
    try:
        handle = nvmlDeviceGetHandleByIndex(gpu_idx)
        util = nvmlDeviceGetUtilizationRates(handle)
        # gpu_util = int(util.gpu)
    except NVMLError as err:
        error = handleError(err)
        # gpu_util = error
        util = error
    return util


def getGpuMemory(gpu_idx):
    try:
        handle = nvmlDeviceGetHandleByIndex(gpu_idx)
        mem = nvmlDeviceGetMemoryInfo(handle)
    except NVMLError as err:
        error = handleError(err)
        mem = error
    return mem


def getMemoryPercent(filelist):
    # docker_memory_used_path = "/sys/fs/cgroup/memory/docker/" + str(container_id) + "*/memory.usage_in_bytes"
    total_memory_path = "/proc/meminfo"

    memory_docker_used = 0.0
    total_memory = 1.0
    for filename in filelist:
        with open(filename, 'r') as f:
            for line in f:
                memory_docker_used = int(line)

    with open(total_memory_path, 'r') as f:
        for line in f:
            if line.startswith('MemTotal'):
                lines = line.split()
                total_memory = int(lines[1]) * 1024
                break
    return [memory_docker_used, total_memory]


def getDiskReadBytes(filelist):
    # docker_disk_path = "/sys/fs/cgroup/blkio/docker/" + str(container_id) + "*/blkio.throttle.io_service_bytes"
    read_bytes = 0
    write_bytes = 0
    for filename in filelist:
        with open(filename, 'r') as f:
            for line in f:
                items = line.split()
                if len(items) != 3 or len(items) != 2:
                    return -1
                if items[1] == 'Read':
                    read_bytes += int(items[1])
    return read_bytes


def getDiskWriteBytes(filelist):
    # docker_disk_path = "/sys/fs/cgroup/blkio/docker/" + str(container_id) + "*/blkio.throttle.io_service_bytes"
    write_bytes = 0
    for filename in filelist:
        with open(filename, 'r') as f:
            for line in f:
                items = line.split()
                if len(items) != 3 or len(items) != 2:
                    return -1
                if items[1] == 'Write':
                    write_bytes += int(items[1])
    return write_bytes


def getNetworkBytes(filename):
    receive_bytes, transmit_bytes = 0, 0
    with open(filename, 'r') as f:
        for line in f:
            if len(line.split()) != 17:
                continue
            else:
                items = line.split()
                receive_bytes += int(items[1])
                transmit_bytes += int(items[9])
    return [receive_bytes, transmit_bytes]


# The analyze function
def AnalyzeSamples(sample_list):
    if len(sample_list) == 0:
        return
    count = len(sample_list)
    min_cpu, min_cpu_idx = sample_list[0]._cpu_usage, 0
    max_cpu, max_cpu_idx = sample_list[0]._cpu_usage, 0
    min_gpu, min_gpu_idx = sample_list[0]._gpu_usage, 0
    max_gpu, max_gpu_idx = sample_list[0]._gpu_usage, 0
    min_mem, min_mem_idx = sample_list[0]._mem_used, 0
    max_mem, max_mem_idx = sample_list[0]._mem_used, 0
    max_read, max_read_idx = sample_list[0]._read_bytes, 0
    sum_cpu, sum_gpu, sum_mem, sum_read = 0, 0, 0, 0
    cpu_when_gpu_low = list()
    mem_when_gpu_low = list()
    disk_read_when_gpu_low = list()
    for i in range(1, count):
        if sample_list[i]._cpu_usage < min_cpu:
            min_cpu = sample_list[i]._cpu_usage
            min_cpu_idx = i
        if sample_list[i]._cpu_usage > max_cpu:
            max_cpu = sample_list[i]._cpu_usage
            max_cpu_idx = i
        if sample_list[i]._gpu_usage < min_gpu:
            min_gpu = sample_list[i]._gpu_usage
            min_gpu_idx = i
        if sample_list[i]._gpu_usage > max_gpu:
            max_gpu = sample_list[i]._gpu_usage
            max_gpu_idx = i
        if sample_list[i]._mem_used < min_mem:
            min_mem = sample_list[i]._mem_used
            min_mem_idx = i
        if sample_list[i]._mem_used > max_mem:
            max_mem = sample_list[i]._mem_used
            max_mem_idx = i
        if sample_list[i]._read_bytes > max_read:
            max_read = sample_list[i]._read_bytes
            max_read_idx = i

        if sample_list[i]._gpu_usage <= 10:
            cpu_when_gpu_low.append(sample_list[i]._cpu_usage)
            mem_when_gpu_low.append(sample_list[i]._mem_used)
            disk_read_when_gpu_low.append(sample_list[i]._read_bytes)

        sum_cpu += sample_list[i]._cpu_usage
        sum_gpu += sample_list[i]._gpu_usage
        sum_mem += sample_list[i]._mem_used
        sum_read += sample_list[i]._read_bytes

    length_gpu_low = len(cpu_when_gpu_low)
    if length_gpu_low == 0:
        length_gpu_low = 1

    print("%f\t%f\t%f\t%f\t%f\t%f\t%f\t%f\t%f\t%f\t%f" %
          (max_gpu, sum_gpu / count, max_cpu, sum_cpu / count, max_mem, sum_mem / count, max_read, sum_read,
           sum(cpu_when_gpu_low) / length_gpu_low,
           sum(mem_when_gpu_low) / length_gpu_low,
           sum(disk_read_when_gpu_low) / length_gpu_low))
    return [max_gpu, sum_gpu / count, max_cpu, sum_cpu / count, max_mem, sum_mem / count, max_read, sum_read,
            sum(cpu_when_gpu_low) / length_gpu_low,
            sum(mem_when_gpu_low) / length_gpu_low,
            sum(disk_read_when_gpu_low) / length_gpu_low]


def Start_Sample(container_id, container_pid, period, flag, one_duration, dir, gpu_id):
    if not os.path.exists('./' + dir):
        os.mkdir(dir)
    realtime_log = csv.writer(open('./' + dir + '/log_result.csv', 'w', newline=''))
    analyze_log = csv.writer(open('./' + dir + '/analyze_result.csv', 'w', newline=''))

    str_write_realtime = ['cpu_usage', 'mem_used', 'IO_read', 'IO_write', 'network_receive', 'network_transmit']
    for i in range(len(gpu_id)):
        str_write_realtime.append('gpu_usage_' + str(gpu_id[i]))
        str_write_realtime.append('gpu_mem_used_' + str(gpu_id[i]))
    realtime_log.writerow(str_write_realtime)

    analyze_log.writerow(['max_gpu', 'avg_gpu', 'max_cpu', 'avg_cpu', 'max_mem', 'avg_mem', 'max_read', 'sum_read',
                          'avg_cpu_gpu_low', 'avg_mem_gpu_low', 'avg_IO_gpu_low'])
    nvmlInit()
    sample_list = list()
    Container_CPU_filelist = list()
    Container_MEM_filelist = list()
    Container_BLK_filelist = list()
    Container_NET_file = ''

    print(
        "max_gpu\tavg_gpu\tmax_cpu\tavg_cpu\tmax_memory\tavg_memory\tmax_read\ttotal_read\tavg_cpu_when_gpu_low\tavg_mem_when_gpu_low\tavg_io_when_gpu_low")

    if flag == 0:
        Container_CPU_filelist = glob.glob("/sys/fs/cgroup/cpuacct/docker/" + str(container_id) + "*/cpuacct.stat")
        Container_MEM_filelist = glob.glob(
            "/sys/fs/cgroup/memory/docker/" + str(container_id) + "*/memory.usage_in_bytes")
        Container_BLK_filelist = glob.glob(
            "/sys/fs/cgroup/blkio/docker/" + str(container_id) + "*/blkio.throttle.io_service_bytes")
        Container_NET_file = "/proc/" + str(container_pid) + "/net/dev"
    elif flag == 1:
        Container_CPU_filelist.append("/sys/fs/cgroup/cpuacct/cpuacct.stat")
        Container_MEM_filelist.append("/sys/fs/cgroup/memory/memory.usage_in_bytes")
        Container_BLK_filelist.append("/sys/fs/cgroup/blkio/blkio.throttle.io_service_bytes")
        Container_NET_file = "/proc/net/dev"
    while True:
        # 1st info about I/O and network
        read_bytes1 = getDiskReadBytes(Container_BLK_filelist)
        write_bytes1 = getDiskWriteBytes(Container_BLK_filelist)
        [network_receive1, network_transmit1] = getNetworkBytes(Container_NET_file)

        # CPU usage will cost time('period') running
        cpu_usage = getCPUPercent(Container_CPU_filelist, period)[-1]
        [mem_used, mem_total] = getMemoryPercent(Container_MEM_filelist)

        # 2nd info about I/O and network, calculate how many bytes used in this period
        read_bytes2 = getDiskReadBytes(Container_BLK_filelist)
        write_bytes2 = getDiskWriteBytes(Container_BLK_filelist)
        [network_receive2, network_transmit2] = getNetworkBytes(Container_NET_file)

        # get the usage of the first GPU to analyze
        gpu_util = getGpuUtilization(gpu_id[0])
        gpu_mem = getGpuMemory(gpu_id[0])

        sample_list.append(
            Sample(cpu_usage, gpu_util.gpu, mem_used, mem_total, gpu_mem.used, gpu_mem.total, read_bytes2 - read_bytes1,
                   write_bytes2 - write_bytes1, network_receive2 - network_receive1,
                   network_transmit2 - network_transmit1)
        )

        str_write_realtime = [cpu_usage, mem_used, read_bytes2 - read_bytes1, write_bytes2 - write_bytes1,
                              network_receive2 - network_receive1, network_transmit2 - network_transmit1]
        # the real-time file will log the information of all the GPUs that the model use
        for i in range(len(gpu_id)):
            str_write_realtime.append(getGpuUtilization(gpu_id[i]).gpu)
            str_write_realtime.append(getGpuMemory(gpu_id[i]).used)
        realtime_log.writerow(str_write_realtime)

        if len(sample_list) > one_duration / period:
            analyze_log.writerow(AnalyzeSamples(sample_list))
            sample_list = list()


# prepare for the args
parser = argparse.ArgumentParser(description='The Profiler to collect the hardware information')
parser.add_argument('--container_id', '-i', help='The SHA of the docker container', required=True)
parser.add_argument('--container_pid', '-p', help='The pid of the docker container', required=True)
parser.add_argument('--Sample_period', help='The period of the CPU usage collecting', required=True, type=float)
parser.add_argument('--Host_Docker', help='Whether the profiler running on host or docker', required=True)
parser.add_argument('--Duration', help='The duration of sampling the data once', required=True, type=float)
parser.add_argument('--output_dir', '-o', help='The output directory to store the files', required=True)
parser.add_argument('--GPU_INDEX', '-g', help='Which GPUS the deep learning model is using', required=True)
args = parser.parse_args()

if __name__ == '__main__':
    # whether the profiler running on host or docker
    flag = -1
    if args.Host_Docker == 'Host':
        flag = 0
    else:
        flag = 1
    # get the GPU INDEX
    GPU_INDEX = list(map(int, args.GPU_INDEX.split(',')))
    Start_Sample(args.container_id, args.container_pid, args.Sample_period, flag, args.Duration, args.output_dir,
                 GPU_INDEX)
