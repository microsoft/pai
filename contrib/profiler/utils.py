class Advise:
    def __init__(self, advise_list=None):
        self._advise = ['The model does not need to be optimized.',
                        'There is maldistribution of the GPU memory between the multiple GPUs.',
                        'The batch size can be more.',
                        'There is still potential to improve in kernel fusion',
                        'There is still potential to improve in Input pipeline'
                        ] if not advise_list else advise_list
        self._times = [0] * len(self._advise)
        self._total = 0

    def add_total(self):
        self._total += 1

    def add_times(self, index):
        if index >= len(self._times):
            return
        self._times[index] += 1

    def get_advise(self):
        print('===================================================================')
        print('We have finished the analyzing %d times and the result is as follow.' % self._total)
        print('According to the voting, the weight of each advice is as follow:')
        result = list()
        for i in range(len(self._advise)):
            weight = self._times[i] / self._total * 100
            print('%.3f%% analyzing result is: ' % weight, self._advise[i])
            if self._times[i] / self._total >= 0.5:
                result.append(self._advise[i])
        print('===================================================================')
        return result


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
