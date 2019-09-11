# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
# rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
# and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above
# copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


"""
The profiler is used to profile the using information of the hardware while a deep learing model is running
"""
import pynvml as nv
import numpy as np
import glob
import csv
import os
import time
import argparse
from contrib.profiler.utils import Sample
from contrib.profiler.utils import Advise
from contrib.profiler.utils import print_process
from contrib.profiler.utils import SlideWindows


# To get the CPU running time of system from being booted
def get_system_cpu_ticks():
    with open('/proc/stat', 'r') as f:
        for line in f.readlines():
            if line.startswith('cpu '):
                items = line.split()
                if len(items) < 8:
                    return -1

                total_clock_ticks = 0
                for item in items[1:8]:
                    total_clock_ticks += int(item)
                return total_clock_ticks
    return -1


# To get the CPU running time of container from being booted
def get_container_cpu_ticks(file_list):
    user_time = 0
    system_time = 0
    for filename in file_list:
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


def get_cpu_ticks(file_list):
    sys_ticks = get_system_cpu_ticks()
    container_ticks = get_container_cpu_ticks(file_list)
    return [sys_ticks, container_ticks]


def get_gpu_utilization(gpu_idx):
    try:
        handle = nv.nvmlDeviceGetHandleByIndex(gpu_idx)
        util = nv.nvmlDeviceGetUtilizationRates(handle)
    except nv.NVMLError as err:
        util = err
    return util


def get_gpu_memory(gpu_idx):
    try:
        handle = nv.nvmlDeviceGetHandleByIndex(gpu_idx)
        mem = nv.nvmlDeviceGetMemoryInfo(handle)
    except nv.NVMLError as err:
        mem = err
    return mem


def get_memory_percent(file_list):
    total_memory_path = '/proc/meminfo'

    memory_docker_used = 0.0
    total_memory = 1.0
    for filename in file_list:
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


def get_disk_read_bytes(file_list):
    read_bytes = 0
    for filename in file_list:
        with open(filename, 'r') as f:
            for line in f:
                items = line.split()
                if len(items) != 3 or len(items) != 2:
                    return -1
                if items[1] == 'Read':
                    read_bytes += int(items[1])
    return read_bytes


def get_disk_write_bytes(file_list):
    write_bytes = 0
    for filename in file_list:
        with open(filename, 'r') as f:
            for line in f:
                items = line.split()
                if len(items) != 3 or len(items) != 2:
                    return -1
                if items[1] == 'Write':
                    write_bytes += int(items[1])
    return write_bytes


def get_network_bytes(filename):
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


def get_sample_data(cpu_file_list, mem_file_list, blk_file_list, net_file, gpu_id, period):
    [mem_used, mem_total] = get_memory_percent(mem_file_list)

    # 1st info about I/O, network and CPU
    read_bytes1 = get_disk_read_bytes(blk_file_list)
    write_bytes1 = get_disk_write_bytes(blk_file_list)
    [network_receive1, network_transmit1] = get_network_bytes(net_file)
    [sys_ticks1, container_ticks1] = get_cpu_ticks(cpu_file_list)
    time.sleep(period)
    # 2nd info about I/O, network and CPU, calculate how many bytes used in this period
    read_bytes2 = get_disk_read_bytes(blk_file_list)
    write_bytes2 = get_disk_write_bytes(blk_file_list)
    [network_receive2, network_transmit2] = get_network_bytes(net_file)
    [sys_ticks2, container_ticks2] = get_cpu_ticks(cpu_file_list)

    online_cpus = os.sysconf(os.sysconf_names['SC_NPROCESSORS_ONLN'])
    cpu_usage = (container_ticks2 - container_ticks1) * 1.0 / (sys_ticks2 - sys_ticks1) * online_cpus * 100

    # get the usage of the GPU to analyze
    gpu_usage = list()
    gpu_mem = list()
    gpu_mem_used = list()
    gpu_mem_total = list()
    for gid in gpu_id:
        gpu_usage.append(get_gpu_utilization(gid).gpu)
        gpu_mem.append(get_gpu_utilization(gid).memory)
        gpu_mem_used.append(get_gpu_memory(gid).used)
        gpu_mem_total.append(get_gpu_memory(gid).total)
    sample_data = Sample(cpu_usage, mem_used, mem_total, read_bytes2 - read_bytes1, write_bytes2 - write_bytes1,
                         network_receive2 - network_receive1, network_transmit2 - network_transmit1, gpu_usage, gpu_mem,
                         gpu_mem_used, gpu_mem_total)
    return sample_data


# The analyze function. It will be modified when the analyzing module is finished.
def analyze_samples(sample_list, advise):
    sample_list = np.array(sample_list, dtype=np.float)
    used_gpu_num = (sample_list.shape[1] - 6) / 4
    cpu_usage = sample_list[:, 0]
    mem_usage = sample_list[:, 1] / sample_list[:, 2]
    gpu_usage = list()
    gpu_mem_usage = list()
    for i in range(int(used_gpu_num)):
        gpu_usage.append(sample_list[:, 6 + i * 4])
        gpu_mem_usage.append(sample_list[:, 8 + i * 4] / sample_list[:, 9 + i * 4])

    if used_gpu_num >= 2:
        # multiple GPUs, analyze whether each GPU has the same memory usage
        gpu_mem_avg_0 = np.average(gpu_mem_usage[0])
        gpu_mem_avg_1 = np.average(gpu_mem_usage[1])
        if abs(gpu_mem_avg_0 - gpu_mem_avg_1) > 0.15:
            advise.add_times(index=1)

    if np.average(gpu_usage[0]) >= 90:
        advise.add_times(index=0)
    else:
        if np.average(gpu_mem_usage[0]) < 0.80:
            advise.add_times(index=2)
        else:
            advise.add_times(index=3)
        # slide the cpu and get the value to divide the cpu value
        slide_windows = SlideWindows(10)
        cpu_slide = list()
        for i in range(cpu_usage.shape[0]):
            cpu_slide.append(slide_windows.get_data(cpu_usage[i]))
        cpu_slide_copy = cpu_slide.copy()
        cpu_slide_copy.sort()
        cpu_std_max = cpu_slide_copy[int(len(cpu_slide_copy) * 0.8)]
        cpu_std_min = cpu_slide_copy[int(len(cpu_slide_copy) * 0.2)]

        gpu_usage_up_down = [0]
        for i in range(1, len(gpu_usage[0])):
            if gpu_usage[0][i] > gpu_usage[0][i - 1]:
                gpu_usage_up_down.append(1)
            elif gpu_usage[0][i] < gpu_usage[0][i - 1]:
                gpu_usage_up_down.append(-1)
            else:
                gpu_usage_up_down.append(0)
        gpu_usage_up_down[0] = gpu_usage_up_down[1]

        # Solution 1
        gpu_up_interval = list()
        gpu_down_interval = list()
        up_flag = True
        down_flag = True
        for i in range(len(gpu_usage_up_down)):
            if gpu_usage_up_down[i] == 1 and up_flag:
                up_flag = False
            elif i >= 1 and gpu_usage_up_down[i] == -1 and not up_flag:
                up_flag = True

            if gpu_usage_up_down[i] == -1 and down_flag:
                down_flag = False
            elif i >= 1 and gpu_usage_up_down[i] == 1 and not down_flag:
                down_flag = True
            if not up_flag:
                gpu_up_interval.append(i)
            elif not down_flag:
                gpu_down_interval.append(i)
        up_cpu_min, down_cpu_min = 0, 0
        up_cpu_max, down_cpu_max = 0, 0
        for i in range(1, len(cpu_slide) - 1):
            if cpu_slide[i] < cpu_slide[i - 1] and cpu_slide[i] < cpu_slide[i + 1] and cpu_slide[i] < cpu_std_min:
                if i in gpu_up_interval:
                    up_cpu_min += 1
                elif i in gpu_down_interval:
                    down_cpu_min += 1
            if cpu_slide[i] > cpu_slide[i - 1] and cpu_slide[i] > cpu_slide[i + 1] and cpu_slide[i] > cpu_std_max:
                if i in gpu_up_interval:
                    up_cpu_max += 1
                elif i in gpu_down_interval:
                    down_cpu_max += 1
        if float(down_cpu_min / (up_cpu_min + down_cpu_min)) > 0.6 or float(
                up_cpu_max / (up_cpu_max + down_cpu_max)) > 0.6:
            advise.add_times(index=4)
    advise.add_total()


def start_sample(container_id, period, analyze_period, duration, output_dir, gpu_id, container_pid):
    start_time = time.time()
    if not os.path.exists('./' + output_dir):
        os.mkdir(output_dir)
    realtime_log = csv.writer(open('./' + output_dir + '/log_result.csv', 'w'))  # , newline=''))

    str_write_realtime = ['cpu_usage', 'mem_used', 'mem_total', 'IO_read', 'IO_write', 'network_receive',
                          'network_transmit']
    for i in range(len(gpu_id)):
        str_write_realtime.append('gpu_usage_' + str(gpu_id[i]))
        str_write_realtime.append('gpu_mem_usage_' + str(gpu_id[i]))
        str_write_realtime.append('gpu_mem_used_' + str(gpu_id[i]))
        str_write_realtime.append('gpu_mem_total_' + str(gpu_id[i]))
    realtime_log.writerow(str_write_realtime)

    nv.nvmlInit()
    sample_list = list()
    container_cpu_file_list = list()
    container_mem_file_list = list()
    container_blk_file_list = list()

    if int(container_pid) == -1:
        container_cpu_file_list.append('/sys/fs/cgroup/cpuacct/cpuacct.stat')
        container_mem_file_list.append('/sys/fs/cgroup/memory/memory.usage_in_bytes')
        container_blk_file_list.append('/sys/fs/cgroup/blkio/blkio.throttle.io_service_bytes')
        container_net_file = '/proc/net/dev'
    else:
        container_cpu_file_list = glob.glob('/sys/fs/cgroup/cpuacct/docker/' + str(container_id) + '*/cpuacct.stat')
        container_mem_file_list = glob.glob(
            '/sys/fs/cgroup/memory/docker/' + str(container_id) + '*/memory.usage_in_bytes')
        container_blk_file_list = glob.glob(
            '/sys/fs/cgroup/blkio/docker/' + str(container_id) + '*/blkio.throttle.io_service_bytes')
        container_net_file = '/proc/' + str(container_pid) + '/net/dev'

    advise = Advise()

    while time.time() - start_time < duration * 60:
        sample_data = get_sample_data(container_cpu_file_list, container_mem_file_list, container_blk_file_list,
                                      container_net_file, gpu_id, period)

        sample_list.append(sample_data.get_array())

        str_write_realtime = [sample_data.get_cpu_usage(), sample_data.get_mem_used(), sample_data.get_mem_total(),
                              sample_data.get_read_bytes(), sample_data.get_write_bytes(),
                              sample_data.get_network_receive(), sample_data.get_network_transmit()]
        # the real-time file will log the information of all the GPUs that the model use
        for i in range(len(gpu_id)):
            str_write_realtime.append(sample_data.get_gpu_usage()[i])
            str_write_realtime.append(sample_data.get_gpu_mem()[i])
            str_write_realtime.append(sample_data.get_gpu_mem_used()[i])
            str_write_realtime.append(sample_data.get_gpu_mem_total()[i])
        realtime_log.writerow(str_write_realtime)

        if len(sample_list) > analyze_period / period:
            analyze_samples(sample_list, advise)
            sample_list = list()
            print_process((time.time() - start_time) / (duration * 60))
    print_process(1)
    analyze_result = advise.get_advise()
    # print('The final advice is:')
    # for i, advice in zip(range(len(analyze_result)), analyze_result):
    #     print(i + 1, ':', advice)


# prepare for the args
parser = argparse.ArgumentParser(description='The profiler to collect the hardware information')
parser.add_argument('--container_id', '-i', help='The SHA of the docker container', required=True)
parser.add_argument('--container_pid', '-p', help='The pid of the docker container', required=True)
parser.add_argument('--sample_period', help='The period of the CPU usage collecting', required=True, type=float)
parser.add_argument('--analyze_period', help='The period of the CPU usage analyzing', required=True, type=float)
parser.add_argument('--duration', help='The duration of sampling the data once', required=True, type=float)
parser.add_argument('--output_dir', '-o', help='The output directory to store the files', required=True)
parser.add_argument('--gpu_index', '-g', help='Which GPUS the deep learning model is using', required=True)
args = parser.parse_args()

if __name__ == '__main__':
    # get the GPU INDEX
    GPU_INDEX = list(map(int, args.gpu_index.split(',')))
    start_sample(args.container_id, args.sample_period, args.analyze_period, args.duration, args.output_dir, GPU_INDEX,
                 args.container_pid)
