FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install xgboost dependeces
RUN apt-get update && apt-get install -y \
    git \
    cmake \
    python-setuptools

WORKDIR /root

# clone xgboost and build
RUN git clone --recursive https://github.com/dmlc/xgboost && \
    cd xgboost && mkdir build && cd build && \
    cmake .. -DUSE_CUDA=ON && \
    make && \
    pip install scipy && \
    cd /root/xgboost/python-package && python setup.py install

WORKDIR /root/xgboost
