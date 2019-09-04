# 1.Overview

The Profiler can collect the usage of the hardware while your other program is running.
You can run the Profiler when you want to collect and analyze the information

1. Run your algorithm model.
2. Run the Profiler when you need start collecting.

Your model need be running on the docker, and Profiler can be run on both docker and host.

We recommend to run the Profiler on host.

# 2.How to Run
Please use the shell file 'run.sh' to start the Profiler.

'run.sh' need at least **2** arguments.

The first argument is the SHA of your docker container where your model is running on.
The second argument is the index of GPU that your model will use.(If there are several GPUs used, please use the ',' to separated)

Such as `./run.sh 32f4 1,2,3` if your container's SHA contains `32f4` and the GPU INDEX `1,2 and 3` will be used to train.

Also you can add the third argument to set the period of the sampling, add the fourth argument to set the directory to store the output data,
and add the fifth argument to set how long the profiler will execute(the unit is minute).

Such as `/run.sh 32f4 1,2,3 0.02 My_Data 10`, then the Profiler will collect the information each `0.02s` and store the log file at `./My_Data`,
and it will stop after 10 minutes.
