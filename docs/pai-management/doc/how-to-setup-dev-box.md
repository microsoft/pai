# Setup dev-box document

# Table of Contents
- 1. [Install docker on your server](#c-step-1)
        - 1.1 [Use prebuild dev-box image](#c-step-1.1)
        - 1.2 [build dev-box docker image on your own](#c-step-1.2)
- 2. [Deploy dev-box over existing K8s](#c-step-2)


## Install docker on your server <a name="c-step-1"></a>


```dev-box``` is a docker container used to boot up or/and maintain a PAI cluster. For convenience, we provide a prebuild Docker image on Docker Hub.

### Use prebuild dev-box image <a name="c-step-1.1"></a>

```bash

# Pull the dev-box image from Docker Hub
sudo docker pull docker.io/openpai/dev-box

# Run your dev-box
# Assume the path of custom-hadoop-binary-path in your service-configuration is /pathHadoop,
#   and the path of your cluster-configuration is /pathConfiguration.
# By now, you can leave it as it is, we only mount those two directories into docker container for later usage.
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /pathHadoop:/pathHadoop \
        -v /pathConfiguration:/cluster-configuration  \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box \
        docker.io/openpai/dev-box

# Working in your dev-box
sudo docker exec -it dev-box /bin/bash
cd /pai

# Now you are free to configure your cluster and run PAI commands...

```

### build dev-box docker image on your own <a name="c-step-1.2"></a>

#### Build dev-box on the latest code

```bash

# clone our repo first.
git clone https://github.com/Microsoft/pai.git

# Go into the workdir.
cd pai/src/dev-box/build

# Build your dev-box.
sudo docker build -t dev-box . --file=dev-box.dockerfile

```

#### Start your dev-box container

- Suppose the path of `custom-hadoop-binary-path` in your service-configuration is `/pathHadoop`
- Suppose the directory path of your cluster-configuration is `/pathConfiguration`. Note: Don't change the configuration file name！

```bash

# Run your dev-box
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /pathHadoop:/pathHadoop \
        -v /pathConfiguration:/cluster-configuration  \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box \
        dev-box

# Working in your dev-box
sudo docker exec -it dev-box /bin/bash
cd /pai

# Now you are free to configure your cluster and run PAI commands...

```

## Deploy dev-box over existing K8s <a name="c-step-2"></a>

If you want to deploy dev-box in already deployed kubernetes.

Prerequisites:
The user has installed kubectl on the current machine.

(1) Create a label for the server to be deployed:

```bash
kubectl label --overwrite=true nodes $NODE-IP-ADDRESS dev-box=true
```

(2) Deploy dev-box to kubernetes

```bash
cd pai/src/dev-box

kubectl create -f dev-box-k8s-deploy.yaml
```
