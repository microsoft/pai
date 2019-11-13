# Overview
The profiler can collect the usage of the hardware while your model is
running, analyze the utilization of them, and give the pattern of these
information.
# Usage
Please use the shell file `run.sh` to start the Profiler.  
##### Estimate the blocked time.
Sometimes the deep-learning model will prepare the data when it starts
running. If the profiler is run with the model together, it may sample
the data that when the GPU is not training. So you can set the time to
make the profiler blocked until your deep-learning model training. But
different models have the different blocked time, you need to estimate
the blocked time of your model.
##### Insert the profiler in your command
When you submit a job, you insert the profiler command before your
command to use the profiler.  
```bash
apt update
apt install -y git
git clone https://github.com/AosChen/pai.git
bash pai/contrib/profiler/run.sh -g 0,1,2,3
# your other command
``` 
The above command means that the profiler will sample the GPU index at 0
to 3.  
Here is the explanation of the profiler command.

```bash
./run.sh
    [-c <container_id>]
    [-g <GPU index separated by ','>]
    [-s <sample period>]
    [-a <analyze period>]
```
**run.sh** can receive 4 commands.
1. `-c`: To assign the container that you want to analyze. The parameter
   is the SHA of the container. It is no need to input the complete SHA,
   the conflict prefix is enough. Such as `run.sh -c 234d`.  
   If not set, the default is the container that profiler in.  
   **Attention**: If you use the profiler by inserting the command,
   please not set the command.
2. `-g`: To assign the GPU that you want to analyze. The parameter is
   the GPU index(separated by , if there is multiple cards). Such as
   `run.sh -g 0,1,2,3`.  
   If not set, the default GPU index is the GPU 0.
3. `-s`: To assign the period of each sample. The parameter must be a
   **number**, such as `run.sh -s 0.03`, it means the profiler will
   sample the data each 0.03s.  
   If not set, the default sampling period is 0.02s.
4. `-a`: To assign how often to analyze the sampling data. The parameter
   must be a **number**, such as `run.sh -a 5`, it means the profiler
   will analyze the data each 5s.  
   If not set, the default analyzing period is 10s.
