# Goal

Pai-build responsible for all service's image build as well as binary build if needed.

# Architecture
![Architecture](pai-build/pai-build.png)
We have three main parts of Pai-build: `image configuration`, `build script`, and `utility`.

- **image configuration:** each service of pai have corresponding configuration folder put under `pai-management/src`. and the folder must contain **dockerfile** and **image.yaml** which is the configuration file for service build.
- **build script:** now all build script put under `pai-management/paiLibrary/paiBuild`. `build_center.py` responsible for image build and tag, in addition we also need to build `hadoop-ai` binary in this script. `push_center.py` responsible for push image to docker registry.
- **utility:** provides some common build-related function.


# Dependencies

- **paictl:** a tool to manage pai cluster. Please refer to [paictl readme](https://github.com/Microsoft/pai/blob/master/pai-management/doc/paictl.md) for detail.
- **dockerfile:** each service should prepare one dockerfile. You can refer to [this tutorial](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) to learn how to write dockerfile.
- **image.yaml:** configuration file for ```pai``` build.

# Build

Build image by using ```paictl```.
### Build infrastructure image(s) <a name="Image_Build"></a>

```
python paictl.py image build -p /path/to/cluster-configuration/dir [ -n image-name ]
```

- If hadoop-ai binary is not up-to-date, we will build hadoop-ai binary first.
- Build and tag the image of the corresponding component.
- If the option `-n` is added, only the specified image will be built and tagged.

### Push infrastructure image(s) <a name="Image_Push"></a>

```
python paictl.py image push -p /path/to/cluster-configuration/dir [ -n image-name ]
```

- Push the tagged image to the docker registry which is configured in the ```cluster-configuration```.
- If the option `-n` is added, only the specified image will be pushed.

# Configuration / Reconfiguration

Each service in pai has a image configuration file. This configuration should be named as ```image.yaml```, and be put into the directory of the image. Here is the examples of the configuration.

```yaml

### the file is the relative path which is set in the value of the key src.
### the copy will be placed in the relative path copied_file
### in the path pai-management/ to execute the command "cp -r src dst"

#copy-list:
#  - src: ../xxxxxx
#    dst: src/xxxxxx/copied_file
```

Configuration only consists copy-list part. if you don't need you can just ignore this field then provide an empty image.yaml .

- ```copy-list``` part:
    - In project, we only keep one replica of source code or tool and we won't replace too much replicas in each image's directory. So this parts tell paictl the path to copy the file.
    - Command: ```cp -r pai/pai-management/$src pai/pai-management/$dst ```. ```src``` and ```dst``` is the value in this part.


# Upgrading

If you want to upgrade your component version, please change corresponding dockerfile directly.

# Runtime Requirements

You can build dev-box image with below dockerfile.
- ```container-setup.sh``` please refer to [pai-management/container-setup.sh](https://github.com/Microsoft/pai/blob/master/pai-management/container-setup.sh).
- ```kubectl-install.sh``` please refer to [pai-management/k8sPaiLibrary/maintaintool/kubectl-install.sh](https://github.com/Microsoft/pai/blob/master/pai-management/k8sPaiLibrary/maintaintool/kubectl-install.sh).

```

FROM ubuntu:16.04

RUN apt-get -y update && \
    apt-get -y install \
      nano \
      vim \
      joe \
      wget \
      curl \
      jq \
      gawk \
      psmisc \
      python \
      python-yaml \
      python-jinja2 \
      python-paramiko \
      python-urllib3 \
      python-tz \
      python-nose \
      python-prettytable \
      python-netifaces \
      python-dev \
      python-pip \
      python-mysqldb \
      openjdk-8-jre \
      openjdk-8-jdk \
      openssh-server \
      openssh-client \
      git \
      inotify-tools \
      rsync \
      realpath \
      net-tools && \
    mkdir -p /cluster-configuration &&\
    git clone https://github.com/Microsoft/pai.git &&\
    pip install python-etcd docker kubernetes

ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64

# Only node manager need this.#
#COPY docker-17.06.2-ce.tgz /usr/local
RUN wget https://download.docker.com/linux/static/stable/x86_64/docker-17.06.2-ce.tgz
RUN cp docker-17.06.2-ce.tgz /usr/local
RUN tar xzvf /usr/local/docker-17.06.2-ce.tgz

COPY container-setup.sh /

COPY k8sPaiLibrary/maintaintool/kubectl-install.sh /kubectl-install.sh
RUN /bin/bash kubectl-install.sh

CMD ["/container-setup.sh"]

```

# TO-DO

- Redesign pai folder structure to make it clearer.
- Incremental build.