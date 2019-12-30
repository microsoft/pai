import numpy as np
from enum import Enum

# The info nums before GPU_info
GPU_INFO_OFFSET = 8
# The info nums of each GPU card
INFO_NUM_PER_GPU = 4
# The info nums before GPU_mem in each GPU info
GPU_MEM_OFFSET = 2


class SAMPLE_INFO(Enum):
    timestamp = 0
    cpu_usage = 1
    mem_used = 2
    men_total = 3
    io_read = 4
    io_write = 5
    network_inbound = 6
    network_outbound = 7


class Adviser:
    def __init__(self):
        self._phenomena = ['There is mal-distribution of the GPU memory between the multiple GPUs.',
                           'Both the GPU and GPU memory have free resource.',
                           'GPU memory is full, but the GPU utilization has free resource.',
                           'IO, CPU and GPU raise alternately.'
                           ]
        self._times = [0] * len(self._phenomena)
        self._total = 0
        self._no_need_optimize = True

    def add_total(self):
        self._total += 1

    def add_times(self, index):
        if index >= len(self._times):
            return
        self._times[index] += 1

    def detect_pattern(self, sample_list):
        # sample_list is a 2-D array with m rows and 7 + (num_GPU * 4) cols
        # The number of rows is decided by the sampling time.
        # The number of cols is decided by the number of GPU that used.
        sample_list = np.array(sample_list, dtype=np.float)
        used_gpu_num = int((sample_list.shape[1] - GPU_INFO_OFFSET) / INFO_NUM_PER_GPU)
        cpu_usage = sample_list[:, SAMPLE_INFO.cpu_usage.value]
        mem_usage = sample_list[:, SAMPLE_INFO.mem_used.value] / sample_list[:, SAMPLE_INFO.men_total.value]
        gpu_usage = list()
        gpu_mem_usage = list()
        for i in range(int(used_gpu_num)):
            gpu_usage.append(sample_list[:, GPU_INFO_OFFSET + i * INFO_NUM_PER_GPU])
            gpu_mem_usage.append(
                sample_list[:, GPU_INFO_OFFSET + GPU_MEM_OFFSET + i * INFO_NUM_PER_GPU]
                / sample_list[:, GPU_INFO_OFFSET + GPU_MEM_OFFSET + 1 + i * INFO_NUM_PER_GPU]
            )
        for index in range(0, len(self._phenomena)):
            if index == 0:
                if used_gpu_num >= 2:
                    # multiple GPUs, analyze whether each GPU has the same memory usage
                    gpu_mem_usage_avg = list()
                    for i in range(used_gpu_num):
                        gpu_mem_usage_avg.append(np.average(gpu_mem_usage[i]))
                    gpu_mem_usage_avg.sort()
                    if gpu_mem_usage_avg[-1] < 0.01:
                        continue
                    if abs(gpu_mem_usage_avg[-1] - gpu_mem_usage_avg[0]) > 0.15:
                        self.add_times(index=0)
                    elif abs(gpu_mem_usage_avg[-1] - gpu_mem_usage_avg[0]) / gpu_mem_usage_avg[-1] > 0.15:
                        self.add_times(index=0)
            elif index == 1:
                if np.average(gpu_usage[0]) < 85 and np.average(gpu_mem_usage[0]) < 0.80:
                    self.add_times(index=1)
            elif index == 2:
                if np.average(gpu_usage[0]) < 85 and np.average(gpu_mem_usage[0]) >= 0.80:
                    self.add_times(index=2)
            elif index == 3:
                if np.average(gpu_usage[0]) < 85:
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
                        if cpu_slide[i] < cpu_slide[i - 1] and \
                                cpu_slide[i] < cpu_slide[i + 1] and cpu_slide[i] < cpu_std_min:
                            if i in gpu_up_interval:
                                up_cpu_min += 1
                            elif i in gpu_down_interval:
                                down_cpu_min += 1
                        if cpu_slide[i] > cpu_slide[i - 1] and \
                                cpu_slide[i] > cpu_slide[i + 1] and cpu_slide[i] > cpu_std_max:
                            if i in gpu_up_interval:
                                up_cpu_max += 1
                            elif i in gpu_down_interval:
                                down_cpu_max += 1
                    if up_cpu_min + down_cpu_min != 0 and up_cpu_max + down_cpu_max != 0:
                        if float(down_cpu_min / (up_cpu_min + down_cpu_min)) > 0.6 or float(
                                up_cpu_max / (up_cpu_max + down_cpu_max)) > 0.6:
                            self.add_times(index=3)
        self.add_total()

    def get_advise(self):
        print('===================================================================')
        print('We have finished the analyzing %d times and the result is as follow.' % self._total)
        print('According to the voting, the weight of each advice is as follow:')
        for i in range(len(self._phenomena)):
            weight = self._times[i] / self._total * 100
            if weight >= 80:
                frequency = 'MOST'
            elif weight >= 30:
                frequency = 'SEVERAL'
            elif weight > 0:
                frequency = 'A LITTLE'
            else:
                frequency = 'NO'
            print('There is ', frequency, ' sample showing that \'', self._phenomena[i], '\'')
        print('===================================================================')


class Sample:
    def __init__(self, cpu_usage, mem_used, mem_total, read_bytes, write_bytes, network_receive, network_transmit,
                 gpu_usage, gpu_mem, gpu_mem_used, gpu_mem_total):
        self._cpu_usage = cpu_usage
        self._mem_used = mem_used
        self._mem_total = mem_total
        self._read_bytes = read_bytes
        self._write_bytes = write_bytes
        self._network_receive = network_receive
        self._network_transmit = network_transmit
        self._gpu_usage = gpu_usage
        self._gpu_mem = gpu_mem
        self._gpu_mem_used = gpu_mem_used
        self._gpu_men_total = gpu_mem_total

    def get_cpu_usage(self):
        return self._cpu_usage

    def get_mem_used(self):
        return self._mem_used

    def get_mem_total(self):
        return self._mem_total

    def get_read_bytes(self):
        return self._read_bytes

    def get_write_bytes(self):
        return self._write_bytes

    def get_network_receive(self):
        return self._network_receive

    def get_network_transmit(self):
        return self._network_transmit

    def get_gpu_usage(self):
        return self._gpu_usage

    def get_gpu_mem(self):
        return self._gpu_mem

    def get_gpu_mem_used(self):
        return self._gpu_mem_used

    def get_gpu_mem_total(self):
        return self._gpu_men_total

    def get_array(self):
        result = [self._cpu_usage, self._mem_used, self._mem_total, self._read_bytes, self._write_bytes,
                  self._network_receive, self._network_transmit]
        for i in range(len(self._gpu_usage)):
            result.append(self._gpu_usage[i])
            result.append(self._gpu_mem[i])
            result.append(self._gpu_mem_used[i])
            result.append(self._gpu_men_total[i])
        return result


class SlideWindows(object):
    def __init__(self, size):
        self._size = size
        self._index = 0
        self._data = list()
        self._avg = 0.0

    def get_data(self, new_data):
        if len(self._data) < self._size:
            self._data.append(new_data)
            self._avg = (self._avg * (len(self._data) - 1) + new_data) / len(self._data)
            self._index = (self._index + 1) % self._size
        else:
            self._avg = (self._avg * self._size - self._data[self._index] + new_data) / self._size
            self._data[self._index] = new_data
            self._index = (self._index + 1) % self._size
        return self._avg


def print_process(process):
    if process > 1:
        process = 1
    result = ['='] * 100
    for i in range(int(process * 100)):
        result[i] = '-'
    result[int(process * 100) - 1] = '>'
    print('[' + ''.join(result) + ']' + '%.2f' % float(process * 100) + '% has been finished')
