# Test Docker `--memory` option

## with swap memory

```sh
hayua@stcvl-131:~/pai/examples$ free -g
              total        used        free      shared  buff/cache   available
Mem:             31          16           4           0          10          15
Swap:            15           0          15

hayua@stcvl-131:~/pai/examples$ sudo docker run --memory=1024m -it openpai/stress /bin/bash
WARNING: Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.

hayua@stcvl-131:~/pai/examples$ sudo docker run --memory=1024m -it stress /bin/bash
WARNING: Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.

# passing, 1024 * 1m
root@a6bc36a791c2:/# stress --vm-keep -m 1024 --vm-bytes 1048576
stress: info: [17] dispatching hogs: 0 cpu, 0 io, 1024 vm, 0 hdd

# passing, 1 * 1024m
root@a6bc36a791c2:/# stress --vm-keep -m 1 --vm-bytes 1073741824
stress: info: [3119] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd

# passing, 2 * 1024m. 1g swip used!!!
root@a6bc36a791c2:/# stress --vm-keep -m 2 --vm-bytes 1073741824
stress: info: [3121] dispatching hogs: 0 cpu, 0 io, 2 vm, 0 hdd

# failed, can only use 1g memory, quit after 15g swap full filled
root@a6bc36a791c2:/# stress --vm-keep -m 30 --vm-bytes 1073741824
stress: info: [3124] dispatching hogs: 0 cpu, 0 io, 30 vm, 0 hdd
stress: FAIL: [3124] (415) <-- worker 3154 got signal 9
stress: WARN: [3124] (417) now reaping child worker processes
stress: FAIL: [3124] (451) failed run completed in 26s

```

## without swap memory

```sh
core@paigcr-a-gpu-1023:~$ free -g
              total        used        free      shared  buff/cache   available
Mem:            220           4         192           0          23         212
Swap:             0           0           0
core@paigcr-a-gpu-1023:~$ sudo docker run --memory=1024m -it openpai/stress /bin/bash
WARNING: Your kernel does not support swap limit capabilities or the cgroup is not mounted. Memory limited without swap.



# failed
root@c9c36309a914:/# stress --vm-keep -m 1024 --vm-bytes 1048576
stress: info: [17] dispatching hogs: 0 cpu, 0 io, 1024 vm, 0 hdd
Killed

# failed, ulimit problem
root@c9c36309a914:/# stress --vm-keep -m 1023 --vm-bytes 1048576
bash: start_pipeline: pgrp pipe: Too many open files in system
bash: fork: Cannot allocate memory

# quit and run `ulimit -n 1048576` on host to fix
# skipped

# failed
root@6fbbed745e4b:/# stress --vm-keep -m 1023 --vm-bytes 1048576
stress: info: [16] dispatching hogs: 0 cpu, 0 io, 1023 vm, 0 hdd
Killed

# after failure, nothing could be ran.
root@6fbbed745e4b:/# free -g
bash: fork: Cannot allocate memory
root@6fbbed745e4b:/# ls
bash: fork: Cannot allocate memory

```





