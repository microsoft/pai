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
import pandas as pd
import glob
import csv
import os
import time
import argparse
import matplotlib as mpl

mpl.use('Agg')
import matplotlib.pyplot as plt
from utils import Sample
from utils import Adviser
from utils import print_process
from utils import GPU_INFO_OFFSET
from utils import INFO_NUM_PER_GPU
from utils import GPU_MEM_OFFSET
from utils import SAMPLE_INFO


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
def get_container_cpu_ticks(file_name):
    user_time = 0
    system_time = 0
    with open(file_name, 'r') as f:
        for line in f:
            items = line.split()
            if len(items) != 2:
                return -1
            if items[0] == 'user':
                user_time = int(items[1])
            elif items[1] == 'system':
                system_time = int(items[1])
        return user_time + system_time


def get_cpu_ticks(file_name):
    sys_ticks = get_system_cpu_ticks()
    container_ticks = get_container_cpu_ticks(file_name)
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


def get_memory_percent(file_name):
    total_memory_path = '/proc/meminfo'

    memory_docker_used = 0.0
    total_memory = 1.0
    with open(file_name, 'r') as f:
        for line in f:
            memory_docker_used = int(line)

    with open(total_memory_path, 'r') as f:
        for line in f:
            if line.startswith('MemTotal'):
                lines = line.split()
                total_memory = int(lines[1]) * 1024
                break
    return [memory_docker_used, total_memory]


def get_disk_bytes(file_name):
    read_bytes, write_bytes = 0, 0
    with open(file_name, 'r') as f:
        for line in f:
            items = line.split()
            if len(items) != 3 and len(items) != 2:
                return -1
            if items[1] == 'Read':
                read_bytes += int(items[2])
            elif items[1] == 'Write':
                write_bytes += int(items[2])
    return [read_bytes, write_bytes]


def get_network_bytes(file_name):
    receive_bytes, transmit_bytes = 0, 0
    with open(file_name, 'r') as f:
        for line in f:
            if len(line.split()) != 17:
                continue
            else:
                items = line.split()
                receive_bytes += int(items[1])
                transmit_bytes += int(items[9])
    return [receive_bytes, transmit_bytes]


Byte_GiByte = 1024 * 1024 * 1024
Byte_MiByte = 1024 * 1024
Byte_KiByte = 1024


# get the sample data according to the system file
def get_sample_data(cpu_file, mem_file, blk_file, net_file, gpu_id, period):
    [mem_used, mem_total] = get_memory_percent(mem_file)

    # 1st info about I/O, network and CPU
    # read_bytes1 = get_disk_read_bytes(blk_file)
    # write_bytes1 = get_disk_write_bytes(blk_file)
    [read_bytes1, write_bytes1] = get_disk_bytes(blk_file)
    [network_receive1, network_transmit1] = get_network_bytes(net_file)
    [sys_ticks1, container_ticks1] = get_cpu_ticks(cpu_file)
    time.sleep(period)
    # 2nd info about I/O, network and CPU, calculate how many bytes used in this period
    # read_bytes2 = get_disk_read_bytes(blk_file)
    # write_bytes2 = get_disk_write_bytes(blk_file)
    [read_bytes2, write_bytes2] = get_disk_bytes(blk_file)
    [network_receive2, network_transmit2] = get_network_bytes(net_file)
    [sys_ticks2, container_ticks2] = get_cpu_ticks(cpu_file)

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
        gpu_mem_used.append(get_gpu_memory(gid).used / Byte_GiByte)
        gpu_mem_total.append(get_gpu_memory(gid).total / Byte_GiByte)
    sample_data = Sample(cpu_usage, mem_used / Byte_GiByte, mem_total / Byte_GiByte,
                         (read_bytes2 - read_bytes1) / period / Byte_KiByte,
                         (write_bytes2 - write_bytes1) / period / Byte_KiByte,
                         (network_receive2 - network_receive1) / period / Byte_KiByte,
                         (network_transmit2 - network_transmit1) / period / Byte_KiByte,
                         gpu_usage, gpu_mem, gpu_mem_used, gpu_mem_total)
    return sample_data


# draw the graphs and save them to the files
def draw_graph(sample_datas, output_dir, period, gpu_id):
    if not os.path.exists(output_dir + '/img'):
        os.mkdir(output_dir + '/img')
    sample_datas = np.array(sample_datas)
    gpu_nums = len(gpu_id)

    # draw the GPU memory usage
    gpu_mem, legends, times = list(), list(), list()
    for i in range(int(gpu_nums)):
        gpu_mem.append(100 * sample_datas[:, GPU_INFO_OFFSET + GPU_MEM_OFFSET + i * INFO_NUM_PER_GPU] /
                       sample_datas[:, GPU_INFO_OFFSET + GPU_MEM_OFFSET + i * INFO_NUM_PER_GPU + 1]
                       )
        legends.append('gpu_mem_used_' + str(gpu_id[i]))
    for i in range(sample_datas.shape[0]):
        times.append(i * period)
    plt.figure()
    plt.title('GPU Memory Utilization')
    plt.xlabel('Time(s)')
    plt.ylabel('GPU memory utilization(%)')
    plt.plot(times, np.array(gpu_mem).T)
    plt.legend(legends)
    plt.grid(True)
    plt.savefig(output_dir + '/img/GPU_MEM_Utilization.png')

    # draw the GPU usage
    gpu_usage, legends, times = list(), list(), list()
    for i in range(int(gpu_nums)):
        gpu_usage.append(sample_datas[:, GPU_INFO_OFFSET + i * INFO_NUM_PER_GPU])
        legends.append('gpu_used_' + str(gpu_id[i]))
    for i in range(sample_datas.shape[0]):
        times.append(i * period)
    plt.figure()
    plt.title('GPU Utilization')
    plt.xlabel('Time(s)')
    plt.ylabel('GPU utilization(%)')
    plt.plot(times, np.array(gpu_usage).T)
    plt.legend(legends)
    plt.grid(True)
    plt.savefig(output_dir + '/img/GPU_UTI_Utilization.png')

    # draw the CPU and GPU usage
    times = list()
    length = sample_datas.shape[0]
    gpu_usage = sample_datas[int(0.6 * length):int(0.6 * length) + 1000, GPU_INFO_OFFSET]
    cpu_usage = sample_datas[int(0.6 * length):int(0.6 * length) + 1000, SAMPLE_INFO.cpu_usage.value]
    for i in range(gpu_usage.shape[0]):
        times.append(i * period)
    fig = plt.figure()
    a1 = fig.add_subplot(111)
    a1.set_title('CPU & GPU Utilization')
    a1.plot(times, cpu_usage, label='cpu')
    plt.legend(loc='best')
    a1.set_ylim([0, np.max(cpu_usage) if np.max(cpu_usage) > 100 else 100])
    a1.set_ylabel('CPU utilization(%)')
    a1.set_xlabel('Time(s)')
    a2 = a1.twinx()
    a2.plot(times, gpu_usage, 'orange', label='gpu')
    plt.legend(loc='best')
    a2.set_ylim([0, 100])
    a2.set_ylabel('GPU utilization(%)')
    plt.grid(True)
    plt.savefig(output_dir + '/img/CPU_GPU_Utilization.png')

    # draw the IO usage
    times = list()
    # index 3 and 4 are the column of the I/O rate
    io_rate = [sample_datas[:, SAMPLE_INFO.io_read.value], sample_datas[:, SAMPLE_INFO.io_write.value]]
    legends = ['Disk read', 'Disk write']
    for i in range(sample_datas.shape[0]):
        times.append(i * period)
    plt.figure()
    plt.title('Disk Utilization')
    plt.xlabel('Time(s)')
    plt.ylabel('Disk Utilization(KBps)')
    plt.plot(times, np.array(io_rate).T)
    plt.legend(legends)
    plt.grid(True)
    plt.savefig(output_dir + '/img/Disk_Utilization.png')

    # draw the network usage
    times = list()
    # index 5 and 6 are the column of the network rate
    network_rate = [sample_datas[:, SAMPLE_INFO.network_inbound.value],
                    sample_datas[:, SAMPLE_INFO.network_outbound.value]]
    legends = ['Network Inbound', 'Network Outbound']
    for i in range(sample_datas.shape[0]):
        times.append(i * period)
    plt.figure()
    plt.title('Network Usage')
    plt.xlabel('Time(s)')
    plt.ylabel('Network Utilization(KBps)')
    plt.plot(times, np.array(network_rate).T)
    plt.legend(legends)
    plt.grid(True)
    plt.savefig(output_dir + '/img/Network_Utilization.png')


def analyze_value(sample_datas, period, gpu_id):
    sample_datas = np.array(sample_datas)
    gpu_nums = len(gpu_id)

    # analyze the CPU usage
    # index 0 is the CPU usage
    cpu_usage = np.sort(sample_datas[:, SAMPLE_INFO.cpu_usage.value])
    print('For the CPU, here is the analyze result:')
    print('The max value of the CPU Utilization is', str(np.max(cpu_usage)) + '%')
    print('The min value of the CPU Utilization is', str(np.min(cpu_usage)) + '%')
    print('The average value of the CPU Utilization is', str(np.average(cpu_usage)) + '%')
    print('The standard deviation of the CPU Utilization is', str(np.std(cpu_usage)) + '%')
    print('Less than 50% value is more than', str(cpu_usage[int(0.5 * cpu_usage.shape[0])]) + '%')
    print('Less than 20% value is more than', str(cpu_usage[int(0.8 * cpu_usage.shape[0])]) + '%')
    print('===================================================================')

    # analyze the Disk
    # index 3 and 4 are the Disk read and write
    disk_read = np.sort(sample_datas[:, SAMPLE_INFO.io_read.value])
    disk_write = np.sort(sample_datas[:, SAMPLE_INFO.io_write.value])
    print('For the Disk, here is the analyze result:')
    print('The max value of the Disk read is', str(np.max(disk_read)) + 'KBps')
    min_read = 0
    for i in range(disk_read.shape[0]):
        min_read = disk_read[i]
        if min_read > 0:
            break
    print('The min value of the Disk read (without zero) is', str(min_read) + 'KBps')
    print('The max value of the Disk write is', str(np.max(disk_write)) + 'KBps')
    min_write = 0
    for i in range(disk_write.shape[0]):
        min_write = disk_write[i]
        if min_write > 0:
            break
    print('The min value of the Disk write (without zero) is', str(min_write) + 'KBps')
    print('The total read volume of the Disk is', str(np.sum(disk_read) * period) + 'KB')
    print('The total write volume of the Disk is', str(np.sum(disk_write) * period) + 'KB')
    print('===================================================================')

    # analyze the Network
    # index 5 and 6 are the Network inbound and outbound
    network_inbound = np.sort(sample_datas[:, SAMPLE_INFO.network_inbound.value])
    network_outbound = np.sort(sample_datas[:, SAMPLE_INFO.network_outbound.value])
    print('For the Network, here is the analyze result:')
    print('The max value of the Network Inbound is', str(np.max(network_inbound)) + 'KBps')
    min_inbound = 0
    for i in range(network_inbound.shape[0]):
        min_inbound = network_inbound[i]
        if min_inbound > 0:
            break
    print('The min value of the Network Inbound (without zero) is', str(min_inbound) + 'KBps')
    print('The max value of the Network Outbound is', str(np.max(network_outbound)) + 'KBps')
    min_outbound = 0
    for i in range(network_outbound.shape[0]):
        min_outbound = network_outbound[i]
        if min_outbound > 0:
            break
    print('The min value of the Network Outbound (without zero) is', str(min_outbound) + 'KBps')
    print('The total Inbound volume of the Network is', str(np.sum(network_inbound) * period) + 'KB')
    print('The total Outbound volume of the Network is', str(np.sum(network_outbound) * period) + 'KB')
    print('===================================================================')

    print('For the GPU, here is the analyze result:')
    print('The total number of the GPU cards is', gpu_nums)
    print('===================================================================')

    # analyze the GPU memory
    print('For the GPU memory:')
    for i in range(gpu_nums):
        total_gpu_mem = np.max(sample_datas[:, GPU_INFO_OFFSET + GPU_MEM_OFFSET + 1 + INFO_NUM_PER_GPU * i])
        max_gpu_men = np.max(sample_datas[:, GPU_INFO_OFFSET + GPU_MEM_OFFSET + INFO_NUM_PER_GPU * i])
        print('The memory Utilization of Card Index ', gpu_id[i], 'is %.4f%%' % (max_gpu_men / total_gpu_mem * 100))
    print('===================================================================')

    # analyze the GPU usage
    gpu_usage = np.sort(sample_datas[:, GPU_INFO_OFFSET])
    print('For the GPU utilization, we choose the master card to calculate the result.')
    print('The max value of the GPU Utilization is', str(np.max(gpu_usage)) + '%')
    print('The min value of the GPU Utilization is', str(np.min(gpu_usage)) + '%')
    print('The average value of the GPU Utilization is', str(np.average(gpu_usage)) + '%')
    print('The standard deviation of the GPU Utilization is', str(np.std(gpu_usage)) + '%')
    print('Less than 50% value is more than', str(gpu_usage[int(0.5 * gpu_usage.shape[0])]) + '%')
    print('Less than 20% value is more than', str(gpu_usage[int(0.8 * gpu_usage.shape[0])]) + '%')


def start_sample(container_id, period, analyze_period, output_dir, gpu_id, container_pid, duration_time):
    start_time = time.time()
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    with open(output_dir + '/log_result.csv', 'w') as result_file:
        realtime_log = csv.writer(result_file)

        str_write_realtime = ['timestamp', 'cpu_usage(%)', 'mem_used(GiByte)', 'mem_total(GiByte)', 'IO_read(KiByte/s)',
                              'IO_write(KiByte/s)', 'network_receive(KiByte/s)', 'network_transmit(KiByte/s)']
        for i in range(len(gpu_id)):
            str_write_realtime.append('gpu_usage_' + str(gpu_id[i]))
            str_write_realtime.append('gpu_mem_usage_' + str(gpu_id[i]))
            str_write_realtime.append('gpu_mem_used_' + str(gpu_id[i]))
            str_write_realtime.append('gpu_mem_total_' + str(gpu_id[i]))
        realtime_log.writerow(str_write_realtime)

        sample_list = list()
        # container_cpu_file = ''
        # container_mem_file = ''
        # container_blk_file = ''
        # container_net_file = ''

        if int(container_pid) == -1:
            container_cpu_file = '/sys/fs/cgroup/cpuacct/cpuacct.stat'
            container_mem_file = '/sys/fs/cgroup/memory/memory.usage_in_bytes'
            container_blk_file = '/sys/fs/cgroup/blkio/blkio.throttle.io_service_bytes'
            container_net_file = '/proc/net/dev'
        else:
            container_cpu_file = glob.glob('/sys/fs/cgroup/cpuacct/docker/' + str(container_id) + '*/cpuacct.stat')[0]
            container_mem_file = glob.glob(
                '/sys/fs/cgroup/memory/docker/' + str(container_id) + '*/memory.usage_in_bytes')[0]
            container_blk_file = glob.glob(
                '/sys/fs/cgroup/blkio/docker/' + str(container_id) + '*/blkio.throttle.io_service_bytes')[0]
            container_net_file = '/proc/' + str(container_pid) + '/net/dev'

        adviser = Adviser()
        sample_datas = list()
        stop_flag = False
        last_time = time.time()
        while not (os.path.exists("./stop.flag") or stop_flag):
            sample_data = get_sample_data(container_cpu_file, container_mem_file, container_blk_file,
                                          container_net_file, gpu_id, period)

            str_write_realtime = sample_data.get_array()
            str_write_realtime.insert(0, time.time() - start_time)
            sample_list.append(str_write_realtime)
            sample_datas.append(str_write_realtime)
            realtime_log.writerow(str_write_realtime)

            # if len(sample_list) > analyze_period / period:
            if time.time() - last_time >= analyze_period:
                last_time = time.time()
                adviser.detect_pattern(sample_list)
                sample_list = list()
                if duration_time != -1:
                    print_process((time.time() - start_time) / (duration_time * 60))
                    stop_flag = True if time.time() - start_time > duration_time * 60 else False
        print_process(1)
        adviser.get_advise()
    sample_datas = pd.read_csv(output_dir + '/log_result.csv').values
    analyze_value(sample_datas, period, gpu_id)
    draw_graph(sample_datas, output_dir, period, gpu_id)


# prepare for the args
parser = argparse.ArgumentParser(description='The profiler to collect the hardware information')
parser.add_argument('--container_id', '-i', help='The SHA of the docker container', required=True)
parser.add_argument('--container_pid', '-p', help='The pid of the docker container', required=True)
parser.add_argument('--sample_period', help='The period of the CPU usage collecting', required=True, type=float)
parser.add_argument('--analyze_period', help='The period of the CPU usage analyzing', required=True, type=float)
parser.add_argument('--output_dir', '-o', help='The output directory to store the files', required=True)
parser.add_argument('--duration_time', '-t', help='How long the profiler will execute', required=True, type=int)
args = parser.parse_args()

# Setting the max duration if the job will cost too much time
MAX_TIME_DURATION = 60
if __name__ == '__main__':
    # get the GPU INDEX
    nv.nvmlInit()
    GPU_INDEX = list(range(nv.nvmlDeviceGetCount()))
    duration = MAX_TIME_DURATION if args.duration_time == -1 else args.duration_time
    if os.path.exists("./stop.flag"):
        os.remove("./stop.flag")
    start_sample(args.container_id, args.sample_period, args.analyze_period, args.output_dir, GPU_INDEX,
                 args.container_pid, duration)
