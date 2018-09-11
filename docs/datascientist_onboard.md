# Getting Started with PAI

## Overview
- OpenPAI is an open source platform that provides complete AI model training and resource management capabilities. 
- It supports multiple types of jobs including Deep Learning, Machine Learning, Big Data, etc. 
- It runs jobs in Docker containers and provides container schedule mechanism and user-friendly monitor system.
- It use distributed file system HDFS to store and manage data.
- For Deep Learning jobs, OpenPAI supports all the DL frameworks (including CNTK, TensorFlow, etc.) as long as you install the corresponding packages in your customized job container.  
- Users need to prepare a config file in JSON format and submit it for a job submission 


## Prerequisites
This document assumes:
- The PAI system has already been deployed properly and a docker registry is available to store docker images. 
- You have done the debug of your code on your local machine to ensure it works well.


## Basic Workflow 

To run a job on PAI, you should follow the following basic workflow:
1. Prepare your data and code, upload them to HDFS.
2. Prepare your job container
3. Write a job JSON configuration file
4. Register an account, then submit job
5. Debug job
	
	
## Quick start
This part will guide you getting started  from running our example jobs  by submitting the job's json configuration file straightly without any modification. Thus you don't need to prepare the code, data and job container, which means you just need to go with 4, 5 of Basic Workflow.

- [Quick start with submitting a CIFAR-10 job](https://github.com/Microsoft/pai/blob/master/examples/README.md#quickstart)
- [Learn more example jobs](https://github.com/Microsoft/pai/tree/master/examples#offtheshelf)
   

## Submit your own job
This part will guide you submit your own machine learning or deep learning jobs step by step according to the Basic Workflow.


### 1. Prepare your data and code
We assumes that you've prepared your code on your local machine and done the debug of your code to ensure it works well. 

#### 1.1 Upload files to HDFS	

- Option-1: Use [WebHDFS](https://github.com/Microsoft/pai/blob/master/pai-management/doc/hdfs.md#WebHDFS)  to upload your code and data to HDFS on the system.

- Option-2: Use HDFS tools to upload your code and data to HDFS on the system. We upload a [Docker image](https://hub.docker.com/r/paiexample/pai.example.hdfs/) to DockerHub with built-in HDFS support. On any [Docker installed](https://docs.docker.com/install/linux/docker-ce/ubuntu/) machine, use the following commands to run this container:
  ```
  docker run -it paiexample/pai.example.hdfs /bin/bash
  ```
  Then use the following commands to upload data:
  ```
  hdfs dfs -put /your_local_data_path/ hdfs://hdfs-url/hdfs_path/
  ```
  More commands please refer to the [HDFS commands guide](https://hadoop.apache.org/docs/r2.7.2/hadoop-project-dist/hadoop-hdfs/HDFSCommands.html) for details.

#### 1.2 Operate HDFS data
**Note:** The relative positions of your code and the data downloaded into the container may be changed, debug your code and make sure it can get access to the dataset.

**1.2.1 Small dataset**

If your data size is small, you have the following ways to handle your code and data:

1) You can use HDFS commands in your code to download data to the container when it is launched.
You can specify the download commands in [job JSON configuration file](#3.-Write-a-job-json-configuration-file) `command` field. The commands will be executed right after the container is up. e.g.
    ```
    {
        "jobName": "${your_job_name}",
        "image": "${your_job_container}",
        ...
        ...
        "taskRoles": [
            {
                ...
                ...
                // This command make a dir /root/img/ in this job container, download data from hdfs to this dir 
                // and then execute job script run_job.py
                // Replace hdfs://10.151.40.234:9000 with your own cluster's HDFS url
                "command": "if [ ! -d \"/root/img/\" ]; then mkdir /root/img; fi && hdfs dfs -get hdfs://10.151.40.234:9000/yife/data/img/* /root/img/ && /usr/bin/python3 run_job.py"
            }
        ]
    }
    ```
    
    Or you can download data in your code, use the above example, e.g. you can execute `hdfs dfs -get` command in your `run_job.py`. 

2) Pack code and data into job container

    You can pack your code and dataset into your container when you are [building your job container](#3.1-Need-to-modify-the-DL-framework's-version,-or-add-some-dependencies).

    Use `COPY` command in Dockerfile to copy files from local into container, then build it. 
    
    For more information please refer to [Dockerfile reference](https://docs.docker.com/engine/reference/builder/#copy).

    **Note:** We don't recommend to pack code into container unless your code won't change. Because every time you change your code you will build a new image. You can upload your code to HDFS, then specify the HDFS url of your code in [job JSON configuration file](#3.-Write-a-job-json-configuration-file) `codedir` field, PAI will automatically download it to the job container's path `/pai/code/`.


3) Use HDFS mount.    
    [HDFS mount](https://github.com/Microsoft/hdfs-mount.git) is a tool to mount HDFS as a local Linux file system. Use CNTK job for example, to use this tool, firstly install it in your job container, refer to [CNTK job container Dockerfile](https://github.com/Microsoft/pai/blob/45fb9385db65538d16b5feb2929e67773bc0eeb8/examples/cntk/Dockerfile.example.cntk#L36). Excecute `hdfs-mount` command in your code, e.g. [CNTK job's start script](https://github.com/Microsoft/pai/blob/45fb9385db65538d16b5feb2929e67773bc0eeb8/examples/cntk/cntk-g2p.sh#L31), then you can use the mounted HDFS directory as local file system.


**1.2.2 Large dataset or amount of small files**

If your dataset is large, solutions in the above section may get worse performance, this section provide some solutions to read HDFS data directlly.

If your dataset consist of small files, it can cause namenode memory management problem and compute framework performance problem. People usually pack multiple small files and download it in batches to mitigate this issue.

**Pack data solutions:**
- User compact small files through scripts or opensources tools. (For example using TFRecord for Tensorflow.)
- [HAR (Hadoop Archive) Files](https://hadoop.apache.org/docs/r1.2.1/hadoop_archives.html)
- [Sequence Files](https://wiki.apache.org/hadoop/SequenceFile) 

**HDFS data reading solutions**

- For Tensorflow

    Users can prepare data in [TFrecord](https://www.tensorflow.org/api_guides/python/python_io) format and store it in hdfs:
   - Example scripts: [mnist-examples](https://github.com/cheyang/mnist-examples)
   - How to use:
        ``` bash
        # convert data to TFRecord format
        python convert_to_records.py --directory hdfs://10.*.*.*:9000/test
        # read and train MNIST
        python mnist_train.py --train_dir hdfs://10.*.*.*:9000/test --checkpoint_dir hdfs://10.*.*.*:9000/checkpoint
        ```
    Reference: https://www.alibabacloud.com/help/zh/doc-detail/53928.htm
 
- For Pytorch or other DL framworks in Python

    There is no complete instance on the Internet for pytorch to solve the hdfs small file problem, but users can refer to the following method to build a custom dataloader to try to solve this problem. Official opinion on "pytorch reading hdfs": [issue-97](https://github.com/chainer/chainermn/issues/97), [issue-5867](https://github.com/pytorch/pytorch/issues/5867)

    (1) Create [sequence file](https://wiki.apache.org/hadoop/SequenceFile) at HDFS
  
    Reference example scripts to write a sequence file: [SequenceFileWriterDemo.py](https://github.com/matteobertozzi/Hadoop/blob/master/python-hadoop/examples/SequenceFileWriterDemo.py)
  
  (2) Build customize Pytorch data reader to read from HDFS sequence file
  
    - (2.1) Build Pytorch [customize dataloader](https://discuss.pytorch.org/t/loading-huge-data-functionality/346/2)
    
    Just define a Dataset object, that only loads a list of files in __init__, and loads them every time __getindex__ is called. Then, wrap it in a torch.utils.DataLoader with multiple workers, and you’ll have your files loaded lazily in parallel.

        ``` bash
        class MyDataset(torch.utils.Dataset):
            def __init__(self):
                self.data_files = os.listdir('data_dir')
                sort(self.data_files)
            def __getindex__(self, idx):
                return load_file(self.data_files[idx])
            def __len__(self):
                return len(self.data_files)
        dset = MyDataset()
        loader = torch.utils.DataLoader(dset, num_workers=8)
        ``` 
     - (2.2) Use python [sequence file reader](https://github.com/matteobertozzi/Hadoop/blob/master/python-hadoop/examples/SequenceFileReader.py) method rewrite related methods of dataloader 


### 2. Prepare your job container
PAI run jobs in containers, it supports all the DL frameworks (including CNTK, TensorFlow, etc.) by installing the corresponding packages in your customized job container.

To prepare your customized job container, you should have a [Docker installed](https://docs.docker.com/install/linux/docker-ce/ubuntu/) machine, and a Docker Registry to store your containers, for any node of PAI can pull and get access to the containers. You can use the public  [Docker Hub](https://hub.docker.com/) or any other private registry.

For your convenience, we have pre-built some images for you:
  - openpai/pai.example.tensorflow
  - openpai/pai.example.tensorflow-serving
  - openpai/pai.example.keras.tensorflow
  - openpai/pai.example.sklearn
  - openpai/pai.example.pytorch
  - openpai/pai.example.kafka
  - openpai/pai.example.mxnet
  - openpai/pai.example.caffe2
You can find their Dockerfile in the corresponding directory of [PAI job examples](https://github.com/Microsoft/pai/tree/master/examples).

To customize your own job container, usually there are the following two scenarios:

#### 2.1 Need to modify the DL framework's version, or add some dependencies

You can modify our example's Dockerfile, change the DL framework's version or add the commands to install additional dependencies, then build the image and push it to your own docker registry.

Use tensorflow image for example, firstly find it's [Dockerfile](https://github.com/Microsoft/pai/blob/master/examples/tensorflow/Dockerfile.example.tensorflow), change the version at `ENV TENSORFLOW_VERSION=1.4.0`, install additional dependencies you needed  at `pip install xxxx` or `pip3 install xxxx`, then use the following command to build the image:

```
docker build -f /path-to-dockerfile/Dockerfile.run.tensorflow -t pai.run.tensorflow /path-to-dockerfile/
```

Next, push the built image to the docker registry. Use public registry Docker Hub for example, firstly you should go to Docker Hub homepage to register an account with ${your_user_name}, then:
```
docker login
docker tag pai.run.tensorflow ${your_user_name}/pai.run.tensorflow
docker push ${your_user_name}/pai.run.tensorflow
```
 

#### 2.2 Need to change the CUDA or cuDNN's version
In this scenario, you should rebuild base image, then build job image. Firstly, find the base-image's Dockerfile `Dockerfile.build.base` at [base image directory](https://github.com/Microsoft/pai/tree/master/job-tutorial/Dockerfiles), e.g. change the cuda tag at [cuda9.0-cudnn7/Dockefile.build.base Line33](https://github.com/Microsoft/pai/blob/a59f05fe32934dd1164c26caafc0676f0763b692/job-tutorial/Dockerfiles/cuda9.0-cudnn7/Dockerfile.build.base#L33) , all the version tags can be found at [nvidia/cuda](https://github.com/Microsoft/pai/blob/a59f05fe32934dd1164c26caafc0676f0763b692/job-tutorial/Dockerfiles/cuda9.0-cudnn7/Dockerfile.build.base#L33).
Then run the following command to build and push base image, replace the ${cuda_version} and ${cudnn_version} to the version you chose, replace ${your_user_name} to the user name of your docker registery:
```
docker build -f /path-to-dockerfile/Dockerfile.build.base -t ${your_user_name}/pai.build.base:hadoop2.7.2-cuda${cuda_version}-cudnn${cudnn_version}-devel-ubuntu16.04 Dockerfiles/

docker login
docker push ${your_user_name}/pai.build.base:hadoop2.7.2-cuda${cuda_version}-cudnn${cudnn_version}-devel-ubuntu16.04
```
To build job container from your customized base image, still use tensorflow for example, just replace the [Dockerfile.example.tensorflow Line19](https://github.com/Microsoft/pai/blob/a59f05fe32934dd1164c26caafc0676f0763b692/examples/tensorflow/Dockerfile.example.tensorflow#L19) to the tag of your customized base image's tag, then build and push the job container, the process is the same.
	
### 3. Write a job JSON configuration file 
After you've prepared your data, code and job container, you need write a job configuration file in JSON format to describe the container image you use, the resources you requests,etc. Then submit the configuration file on PAI, it will allocate resources and lauch your job container according to the file.

You can start from our [example directory](https://github.com/Microsoft/pai/tree/master/examples), there is a "*.json" configuraton file under each sub-directory for your reference.

Or you can [write your customized configuration files](https://github.com/Microsoft/pai/blob/master/docs/job_tutorial.md#jobjson).
	
### 4. Register an account, then submit job
Now you are ready to summit a job, find your admin to register a username and password, open PAI homepage, login to summit your job, refer to [Submit a job in Web Portal](https://github.com/Microsoft/pai/blob/master/docs/submit_from_webportal.md) for more details.

Other submit ways:
- [Submit a job in Visual Studio](https://github.com/Microsoft/vs-tools-for-ai/blob/master/docs/pai.md)

- [Submit a job in Visual Studio Code](https://github.com/Microsoft/vscode-tools-for-ai/blob/master/docs/quickstart-05-pai.md)

### 5. Debug job 
Please refer to [debug job document](https://github.com/Microsoft/pai/blob/master/docs/job_tutorial.md#how-to-debug-the-job-) for details.
	
## Getting started by scenarios [TODO]
	1. Trainning a Model
	Training your model on PAI
	
	2. Serving a Model
	Run your model as a long-running service on PAI.
	
	3. Model Prediction
	Use a trained Model to do predictions.

