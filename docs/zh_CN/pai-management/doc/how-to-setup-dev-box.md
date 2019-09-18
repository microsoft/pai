<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

# Setup dev-box document

## Table of Contents

- 1. [What's dev-box?](#introduce)
- 2. [Install docker on your server](#c-step-1)
        - 2.1 [Use prebuild dev-box image](#c-step-1.1)
        - 2.2 [build dev-box docker image on your own](#c-step-1.2)
- 3. [Deploy dev-box over existing K8s](#c-step-2)

## What's dev-box? <a name="introduce"></a>

Dev-Box is a docker container which contains necessary dependent software for paictl to deploy and manage you cluster. With a dev-box, you no longer need to install the software in your host environment, make your host environment's software package clean.

## Install docker on your server <a name="c-step-1"></a>

    dev-box is a docker container used to boot up or/and maintain a PAI cluster. For convenience, we provide a prebuild Docker image on Docker Hub.

### Use prebuild dev-box image <a name="c-step-1.1"></a>

Notice that `dev-box` should run on a machine outside of PAI cluster, it shouldn't run on any PAI cluster node. **replace below v0.x.y to latest release, which can be found [here](https://github.com/Microsoft/pai/releases). For example: v0.9.5**

```bash
<br /># Pull the dev-box image from Docker Hub
sudo docker pull docker.io/openpai/dev-box:v0.x.y

# Run your dev-box
# Assume the path of custom-hadoop-binary-path in your service-configuration is /pathHadoop,
#   and the path of your cluster-configuration is /pathConfiguration.
# By now, you can leave it as it is, we only mount those two directories into docker container for later usage.
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /pathConfiguration:/cluster-configuration  \
        -v /hadoop-binary:/hadoop-binary  \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box \
        docker.io/openpai/dev-box:v0.x.y

# Working in your dev-box
sudo docker exec -it dev-box /bin/bash
cd /pai

# Now you are free to configure your cluster and run PAI commands...

```

### build dev-box docker image on your own <a name="c-step-1.2"></a>

#### Build dev-box on the latest code

**Notice**, replace v0.x.y as above, if you are trying to deploy OpenPAI. You can also remove -b parameter, if you are contributing to latest OpenPAI, but it's unstable.

```bash
<br /># if you are trying to install latest release, replace v0.x.y like to v0.9.5. If you are trying to contribute on OpenPAI, you can remove -b parameter and clone to default branch.
git clone -b v0.x.y https://github.com/Microsoft/pai.git

# Go into the workdir.
cd pai/src/dev-box/

# Build your dev-box.
sudo docker build -t dev-box . --file=build/dev-box.dockerfile

```

#### Start your dev-box container

- Suppose the directory path of your cluster-configuration is `/pathConfiguration`. Note: Don't change the configuration file name！

```bash
<br /># Run your dev-box
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /pathConfiguration:/cluster-configuration  \
        -v /hadoop-binary:/hadoop-binary  \
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

Prerequisites: The user has installed kubectl on the current machine.

(1) Create a label for the server to be deployed:

```bash
kubectl label --overwrite=true nodes $NODE-IP-ADDRESS dev-box=true
```

(2) Deploy dev-box to kubernetes

```bash
cd pai/src/dev-box

kubectl create -f dev-box-k8s-deploy.yaml
```
