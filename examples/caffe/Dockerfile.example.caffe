FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install caffe dependeces
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        git \
        wget \
        libatlas-base-dev \
        libboost-all-dev \
        libgflags-dev \
        libgoogle-glog-dev \
        libhdf5-serial-dev \
        libleveldb-dev \
        liblmdb-dev \
        libopencv-dev \
        libprotobuf-dev \
        libsnappy-dev \
        protobuf-compiler \
        python-setuptools \

WORKDIR /root

# clone caffe and build
RUN git clone --depth 1 https://github.com/BVLC/caffe.git && \
    pip install ipython==5.0.0 && \
    cd caffe/python && for req in $(cat requirements.txt) pydot; do pip install $req; done && cd .. && \
    cp Makefile.config.example Makefile.config && \
    sed -i 's/# USE_CUDNN := 1/USE_CUDNN := 1/g' Makefile.config && \
    sed -i 's@/usr/lib/python2.7/dist-packages/numpy/core/include@/usr/local/lib/python2.7/dist-packages/numpy/core/include@g' Makefile.config && \
    sed -i '/^LIBRARY_DIRS/s@$@ /usr/lib/x86_64-linux-gnu/hdf5/serial@g' Makefile.config && \
    sed -i '/^INCLUDE_DIRS/s@$@ /usr/include/hdf5/serial@g' Makefile.config && \
    make clean && make all && make pycaffe

WORKDIR /root/caffe
