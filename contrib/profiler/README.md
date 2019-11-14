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
apt install -y curl
mkdir profiler
curl https://raw.githubusercontent.com/microsoft/pai/master/contrib/profiler/profiler.py -o profiler/profiler.py
curl https://raw.githubusercontent.com/microsoft/pai/master/contrib/profiler/utils.py -o profiler/utils.py
curl https://raw.githubusercontent.com/microsoft/pai/master/contrib/profiler/run.sh -o profiler/run.sh
bash profiler/run.sh
``` 
The above command means that the profiler will run until your job is
stopped.  
Here is the explanation of the profiler command.

```bash
./run.sh
    [-t   The duration of the profiler]
```
**run.sh** can receive 1 commands.
1. `-t`: To assign how long the profiler will run. The parameter must be
   a number, such as `run.sh -t 30`, it means that the profiler will run
   for 30 minutes.  
   If not set, the profiler will not stop until the user's job is
   stopped.
