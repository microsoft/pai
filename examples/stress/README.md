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

###############################################################################
core@paigcr-a-gpu-1044:~$ free -g
              total        used        free      shared  buff/cache   available
Mem:            220          17         169           1          34         199
Swap:             0           0           0
core@paigcr-a-gpu-1044:~$ sudo docker run --memory=2048m -it openpai/stress /bin/bash
WARNING: Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.

# 1 passing, 1024 * 1m
root@0e76c0f511ea:/# stress --vm-keep -m 1024 --vm-bytes 1m
stress: info: [16] dispatching hogs: 0 cpu, 0 io, 1024 vm, 0 hdd

# 2 failed, 2048 * 1m
root@0e76c0f511ea:/# stress --vm-keep -m 2048 --vm-bytes 1m --vm-hang 0
stress: info: [3091] dispatching hogs: 0 cpu, 0 io, 2048 vm, 0 hdd
Killed
root@0e76c0f511ea:/# ls
bash: start_pipeline: pgrp pipe: Too many open files in system
bash: fork: Cannot allocate memory
# it may take various elapsed time until it recover
root@0e76c0f511ea:/# ls
bin  boot  dev  docker ...
root@0e76c0f511ea:/# dmesg|grep oom
[166546.087202] bash invoked oom-killer: gfp_mask=0x14000c0(GFP_KERNEL), nodemask=(null), order=0, oom_score_adj=0
[166546.087223]  oom_kill_process+0x22e/0x450
[166546.087231]  mem_cgroup_oom_synchronize+0x32a/0x350
[166546.087274] [ pid ]   uid  tgid total_vm      rss pgtables_bytes swapents oom_score_adj name
root@0e76c0f511ea:/# dmesg|tail
[166546.091630] [20976]     0 20976     2127      346    53248        0             0 stress
[166546.091632] [20977]     0 20977     2127      346    53248        0             0 stress
[166546.091633] [20978]     0 20978     2127      346    53248        0             0 stress
[166546.091635] [20979]     0 20979     2127      346    53248        0             0 stress
[166546.091637] [20980]     0 20980     2127      346    53248        0             0 stress
[166546.091638] [20981]     0 20981     2127      346    53248        0             0 stress
[166546.091649] [14403]     0 14403     4562      122    73728        0             0 bash
[166546.091650] [14404]     0 14404     4562      122    69632        0             0 bash
[166546.091652] Memory cgroup out of memory: Kill process 30225 (bash) score 1 or sacrifice child
[166546.213733] Killed process 19351 (stress) total-vm:8508kB, anon-rss:1108kB, file-rss:276kB, shmem-rss:0kB

# 3. failed,  2 * 1024m
root@ebd9e049fec6:/# stress --vm-keep -m 2 --vm-bytes 1024m --vm-hang 0
stress: info: [16] dispatching hogs: 0 cpu, 0 io, 2 vm, 0 hdd
stress: FAIL: [16] (415) <-- worker 18 got signal 9
stress: WARN: [16] (417) now reaping child worker processes
stress: FAIL: [16] (451) failed run completed in 1s
root@ebd9e049fec6:/# ls
bin  boot  dev ...

# 4. seems `--oom-kill-disable` not work!
core@paigcr-a-gpu-1044:~$ sudo docker run --memory=2048m --oom-kill-disable -it openpai/stress stress --vm-keep -m 2 --vm-bytes 1024m --vm-hang 0
WARNING: Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.
stress: info: [1] dispatching hogs: 0 cpu, 0 io, 2 vm, 0 hdd
stress: FAIL: [1] (415) <-- worker 8 got signal 9
stress: WARN: [1] (417) now reaping child worker processes
stress: FAIL: [1] (451) failed run completed in 1s

```





