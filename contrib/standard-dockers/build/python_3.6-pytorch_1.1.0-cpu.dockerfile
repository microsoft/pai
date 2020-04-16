FROM ubuntu:18.04
ENV LANG C.UTF-8
ENV APT_INSTALL='apt-get install -y --no-install-recommends'
ENV PIP_INSTALL='python -m pip --no-cache-dir install --upgrade'
ENV GIT_CLONE='git clone --depth 10'

RUN rm -rf /var/lib/apt/lists/* \
           /etc/apt/sources.list.d/cuda.list \
           /etc/apt/sources.list.d/nvidia-ml.list

RUN apt-get update

# ==================================================================
# tools
# ------------------------------------------------------------------

RUN DEBIAN_FRONTEND=noninteractive $APT_INSTALL \
        build-essential \
        apt-utils \
        ca-certificates \
        wget \
        git \
        vim \
        libssl-dev \
        curl \
        unzip \
        unrar \
        openssh-client \
        openssh-server

RUN $GIT_CLONE https://github.com/Kitware/CMake ~/cmake && \
    cd ~/cmake && \
    ./bootstrap && \
    make -j"$(nproc)" install

# ==================================================================
# python
# ------------------------------------------------------------------

RUN DEBIAN_FRONTEND=noninteractive $APT_INSTALL software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive $APT_INSTALL \
        python3.6 \
        python3.6-dev \
        python3-distutils-extra
RUN wget -O ~/get-pip.py https://bootstrap.pypa.io/get-pip.py
RUN python3.6 ~/get-pip.py
RUN ln -s /usr/bin/python3.6 /usr/local/bin/python3
RUN ln -s /usr/bin/python3.6 /usr/local/bin/python
RUN $PIP_INSTALL setuptools
RUN $PIP_INSTALL \
        numpy \
        scipy \
        pandas \
        cloudpickle \
        scikit-image>=0.14.2 \
        scikit-learn \
        matplotlib \
        Cython \
        tqdm \
        jupyter \
        contextlib2

# ==================================================================
# jupyter-config
# ------------------------------------------------------------------

RUN mkdir -p /root/.jupyter
COPY ./jupyter_notebook_config.py /root/.jupyter

# ==================================================================
# pytorch
# ------------------------------------------------------------------

RUN $PIP_INSTALL \
        future \
        numpy \
        protobuf \
        enum34 \
        pyyaml \
        typing
RUN $PIP_INSTALL torch==1.1.0 torchvision==0.3.0 \
    -f https://download.pytorch.org/whl/cpu/torch_stable.html
RUN $PIP_INSTALL Pillow==6.2.2  # fix for https://github.com/pytorch/vision/issues/1712

# ==================================================================
# config & cleanup
# ------------------------------------------------------------------

RUN ldconfig && \
    apt-get clean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/* /tmp/* ~/*
WORKDIR /root

EXPOSE 8888