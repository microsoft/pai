# Quick Start

## Submit a Hello World Job

The **job** of OpenPAI defines how to execute code(s) and command(s) in specified environment(s). A job can be run on single node or distributedly.

The following process submits a model training job implemented by TensorFlow on CIFAR-10 dataset. It downloads data and code from internet and helps getting started with OpenPAI. [Next Section](#Learn-the-Hello-World-Job) includes more details about this job config.

1. Login to OpenPAI web portal.

2. Click **Submit Job** on the left pane, then click `Single` to reach this page.

    <img src="/manual/cluster-user/imgs/hello-world-click-submit.png" width="90%" height="90%" alt="hello_world1" />

3. Select your virtual cluster, and give a name of your job. Then copy the following commands into the command box.

   ```bash
   git clone https://github.com/tensorflow/models
   cd models/research/slim
   python download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data
   python train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --max_number_of_steps=1000
   ```

   Note: Please **Do Not** use `#` for comments or use `\` for line continuation in the command box. These symbols may break the syntax and will be supported in the future.

    <img src="/manual/cluster-user/imgs/hello-world-command.png" width="90%" height="90%" alt="hello_world2" />

4. Specify the resources you need. By default only GPU number could be set. Toggle the `custom` button if you need to customize CPU number and memory. Here we use the default setting which utilizes 1 GPU, 4 CPU vCores, and 8192 MB memory.

5. Specify the docker image. You can either use the listed docker images or take advantage of your own one. Here we use `openpai/standard:python_3.6-tensorflow_1.15.0-gpu`, which is one of the OpenPAI pre-built images. We will introduce more about docker images in [Work with Docker Images](/manual/cluster-user/work-with-docker-images.md).

   <img src="/manual/cluster-user/imgs/hello-world-resource-and-dockers.png" width="60%" height="60%" alt="hello_world3" />

6. Click **Submit** to kick off your first OpenPAI job!

## Learn the Hello World Job

The Hello World job is set to download the CIFAR-10 dataset and train a simple model with 1,000 steps. Here are some detailed explanations about configs on the submission page:

- **Job name** is the name of current job. It must be unique in each user account. A meaningful name helps manage jobs well.

- **Command** is the commands to run in this task role. It can be multiple lines. For example, in the hello-world job, the command clones code from GitHub, downloads data and then executes the training progress. If one command fails (exits with a nonzero code), the following commands will not be executed. This behavior may be changed in the future.

- **GPU count**, **CPU vcore count**, **Memory (MB)** are easy to understand. They specify corresponding hardware resources including the number of GPUs, the number of CPU cores, and MB of memory.

## Browse stdout, stderr, full logs, metrics