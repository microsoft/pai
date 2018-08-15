# Test Docker `--memory` option

## with swap memory

```sh
hayua@stcvl-131:~/pai/examples$ free -g
              total        used        free      shared  buff/cache   available
Mem:             31          16           4           0          10          15
Swap:            15           0          15

hayua@stcvl-131:~/pai/examples$ sudo docker run --memory=1024m -it openpai/stress /bin/bash
WARNING: Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.

# 1. passing, 1024 * 1m
root@a6bc36a791c2:/# stress --vm-keep -m 1024 --vm-bytes 1m
stress: info: [17] dispatching hogs: 0 cpu, 0 io, 1024 vm, 0 hdd

# 2.a passing, 1 * 1024m
root@a6bc36a791c2:/# stress --vm-keep -m 1 --vm-bytes 1024m
stress: info: [3119] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
# 2.b hang the memory forever
root@5d0cf0a34ee3:/# stress --vm-keep -m 1 --vm-bytes 1024m --vm-hang 0 --verbose
stress: info: [3097] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
stress: dbug: [3097] using backoff sleep of 3000us
stress: dbug: [3097] --> hogvm worker 1 [3098] forked
stress: dbug: [3098] allocating 1073741824 bytes ...
stress: dbug: [3098] touching bytes in strides of 4096 bytes ...
stress: dbug: [3098] sleeping forever with allocated memory


# 3. passing, 2 * 1024m. 1g swip used!!!
root@a6bc36a791c2:/# stress --vm-keep -m 2 --vm-bytes 1024m
stress: info: [3121] dispatching hogs: 0 cpu, 0 io, 2 vm, 0 hdd

# 4.a failed, can only use 1g memory, quit after 15g swap full filled
root@a6bc36a791c2:/# stress --vm-keep -m 30 --vm-bytes 1024m
stress: info: [3124] dispatching hogs: 0 cpu, 0 io, 30 vm, 0 hdd
stress: FAIL: [3124] (415) <-- worker 3154 got signal 9
stress: WARN: [3124] (417) now reaping child worker processes
stress: FAIL: [3124] (451) failed run completed in 26s
# 4.b hang the memory
root@5d0cf0a34ee3:/# stress --vm-keep -m 30 --vm-bytes 1024m --vm-hang 0
stress: info: [4188] dispatching hogs: 0 cpu, 0 io, 30 vm, 0 hdd
stress: FAIL: [4188] (415) <-- worker 4218 got signal 9
stress: WARN: [4188] (417) now reaping child worker processes
stress: FAIL: [4188] (451) failed run completed in 24s


```

## without swap memory

```sh
core@paigcr-a-gpu-1023:~$ free -g
              total        used        free      shared  buff/cache   available
Mem:            220           4         192           0          23         212
Swap:             0           0           0
core@paigcr-a-gpu-1023:~$ sudo docker run --memory=1024m -it openpai/stress /bin/bash
WARNING: Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.

# 1 failed, 1024 * 1m
root@1fb1df880626:/# stress --vm-keep -m 1024 --vm-bytes 1m
stress: info: [16] dispatching hogs: 0 cpu, 0 io, 1024 vm, 0 hdd
Killed
root@1fb1df880626:/# ls
bash: start_pipeline: pgrp pipe: Too many open files in system
bash: fork: Cannot allocate memory
root@1fb1df880626:/# ls
bash: fork: Cannot allocate memory
# TODO !!! it should related to ulimit, the ulimit -n on host return 1024 only

# 2. failed, 1 * 1024m
root@e3e1b7870163:/# stress --vm-keep -m 1 --vm-bytes 1024m
stress: info: [16] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
stress: FAIL: [16] (415) <-- worker 17 got signal 9
stress: WARN: [16] (417) now reaping child worker processes
stress: FAIL: [16] (451) failed run completed in 1s


```





