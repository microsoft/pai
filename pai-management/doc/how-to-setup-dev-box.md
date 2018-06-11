# Setup dev-box

## Recommended: In docker Container

- Install docker on your host.
- Finish configuring the cluster-configuration

#### Build the Dev-Box's docker image.

```bash

# clone our repo first.
git clone https://github.com/Microsoft/pai.git

# Go into the workdir.
cd pai/pai-management/

# Build your dev-box.
sudo docker build -t dev-box .

```

#### Starting Your Dev-Box's contianer

- Suppose the path of ```custom-hadoop-binary-path``` in your service-configuration is ```/pathHadoop```
- Suppose the directory path of your cluster-configuration is ``/pathConfiguration````. Note: Don't change the configuration file name！

```bash
# Running your maintain-box as a docker container.
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /pathConfiguration:/cluster-configuration  \
        -v /var/lib/docker:/var/lib/docker \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /pathHadoop:/pathHadoop \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box \
        dev-box

# Working in your maintain-box
sudo docker exec -it dev-box /bin/bash
cd /pai/pai-management
```