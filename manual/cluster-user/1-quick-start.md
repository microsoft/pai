# Quick Start

## Submit a Hello World Job

The **job** of OpenPAI defines how to execute code(s) and command(s) in specified environment(s). A job can be run on single node or distributedly.

The following process submits a model training job implemented by TensorFlow on CIFAR-10 dataset. It downloads data and code from internet and helps getting started with OpenPAI. [Next Section](#Learn-the-Hello-World-Job) include more details about this job config.

1. Login to OpenPAI web portal.

2. Click **Submit Job** on the left pane and reach this page.
    <img src="/docs/user/imgs/submit_hello_world_1.png" width="90%" height="90%" alt="hello_world1" />

3. Fill in the name of your virtual cluster, and give a name of your job and your task role. Then copy the following commands into the command box.

   ```bash
   apt update
   apt install -y git
   git clone https://github.com/tensorflow/models
   cd models/research/slim
   python download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data
   python train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --max_number_of_steps=1000
   ```

   Note: Please **Do Not** use # for comments or use \ for line continuation in the command box. These symbols may break the syntax and will be supported in the future.

    <img src="/docs/user/imgs/submit_hello_world_2.png" width="90%" height="90%" alt="hello_world2" />

4. Specify the resources you need. By default only gpu number could be set. Toggle the "custom" button if you need to customize CPU number and memory. Here we use the default setting which utilizes one GPU.

5. Specify the docker image. You can either use the listed docker images or take advantage of your own one. Here we use "openpai/tensorflow-py36-cu90" as the docker image. OpenPAI will pull images from the [official Docker Hub](https://hub.docker.com/). If you want to use your own Docker registry, please click the "Auth" button and fill in the required information.

   <img src="/docs/user/imgs/submit_hello_world_3.png" width="60%" height="60%" alt="hello_world3" />

6. Click **Submit** to kick off your first OpenPAI job!

## Learn the Hello World Job

The Hello World job is set to download the CIFAR-10 dataset and train a simple model with 1,000 steps. Here are some detailed explanations about configs on the submission page:

- **Job name** is the name of current job. It must be unique in each user account. A meaningful name helps manage jobs well.

- **Task role name** defines names of different roles in a job.

  For single server jobs, there is only one role in taskRoles.

  For distributed jobs, there may be multiple roles in taskRoles. For example, when TensorFlow is used to running distributed job, it has two roles, including parameter server and worker. There are two task roles in the corresponding job configuration. The names of task roles can be used in environment variables in distributed jobs.

- **Instances** is the number of instances of this task role. In single server jobs, it should be 1. In distributed jobs, it depends on how many instances are needed for a task role. For example, if it's 8 in a worker role of TensorFlow. It means there should be 8 Docker containers for the worker role.

- **GPU count**, **CPU vcore count**, **Memory (MB)** are easy to understand. They specify corresponding hardware resources including the number of GPUs, MB of memory, and the number of CPU cores.

- **Command** is the commands to run in this task role. It can be multiple lines. For example, in the hello-world job, the command clones code from GitHub, downloads data and then executes the training progress. If one command fails (exits with a nonzero code), the following commands will not be executed. This behavior may be changed in the future.

- **Docker image**

  OpenPAI uses [Docker](https://www.docker.com/why-docker) to provide consistent and independent environments. With Docker, OpenPAI can serve multiple job requests on the same server. The job environment depends significantly on the docker image you select.

  The hub.docker.com is a public Docker repository. In the hello-world example, it uses a TensorFlow image, *openpai/tensorflow-py36-cu90*. You can also set your own image from private repository by toggling custom button.

  If an appropriate Docker image isn't found, you could [build a Docker image](../job_docker_env.md) by your self.

  **Important Note: if you'd like to ssh to the docker within OpenPAI, make sure *openssh-server* and *curl* packages are included by the docker image.** If SSH is needed, a new Docker image can be built and includes *openssh-server* and *curl* on top of the existing Docker image. Please refer to [this tutorial](../job_docker_env.md#enable-ssh-for-your-image) for details.

## Introduction to Pre-built Docker Images