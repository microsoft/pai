FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install deps
RUN apt-get -y update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      cmake \
      git \
      libgoogle-glog-dev \
      libgtest-dev \
      libiomp-dev \
      libleveldb-dev \
      liblmdb-dev \
      libopencv-dev \
      libopenmpi-dev \
      libsnappy-dev \
      libprotobuf-dev \
      libgflags-dev \
      openmpi-bin \
      openmpi-doc \
      protobuf-compiler \
      python-dev \
      python-pip         

# install pip packages
RUN pip install \
      future \
      numpy \
      protobuf \
      networkx \
      enum

WORKDIR /root

# clone caffe2 source code and build
RUN git clone --recursive https://github.com/pytorch/pytorch.git && cd pytorch && \
    git submodule update --init

RUN mkdir build && cd build && \
    cmake .. && \
    make clean && make install

ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

WORKDIR /root/pytorch/caffe2/python/examples