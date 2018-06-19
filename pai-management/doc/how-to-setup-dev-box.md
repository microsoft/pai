# Setup dev-box

## Install docker on your server

```dev-box``` is a docker container you could use to maintain PAI cluster. And we provide a prebuild image hosted on Docker Hub for your convenience.

## Use prebuild dev-box image

```bash

# Pull the dev-box image from Docker Hub
sudo docker pull docker.io/openpai/dev-box

# Run your dev-box
# Assume the path of custom-hadoop-binary-path in your service-configuration is /pathHadoop.
# Assume the directory path of your cluster-configuration is /pathConfiguration.
# By the way, both of the above could be an empty directory.
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
        docker.io/openpai/dev-box

# Working in your dev-box
sudo docker exec -it dev-box /bin/bash
cd /pai/pai-management

# Now you are free to configure your cluaster and run PAI commands...

```

## Or build dev-box docker image on your own

### Build dev-box on the latest code

```bash

# clone our repo first.
git clone https://github.com/Microsoft/pai.git

# Go into the workdir.
cd pai/pai-management/

# Build your dev-box.
sudo docker build -t dev-box .

```

### Start Your dev-box contianer

- Suppose the path of ```custom-hadoop-binary-path``` in your service-configuration is ```/pathHadoop```
- Suppose the directory path of your cluster-configuration is ``/pathConfiguration````. Note: Don't change the configuration file name！

```bash

# Run your dev-box
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

# Working in your dev-box
sudo docker exec -it dev-box /bin/bash
cd /pai/pai-management

# Now you are free to configure your cluaster and run PAI commands...

```