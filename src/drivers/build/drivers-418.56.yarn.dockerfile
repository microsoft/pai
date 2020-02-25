# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

FROM nvidia/cuda:9.1-cudnn7-devel-ubuntu16.04

ENV STAGE_DIR=/root/drivers \
    PYTHONPATH=/modules

RUN apt-get -y update && \
    apt-get -y install \
        build-essential \
        gcc \
        g++ \
        binutils \
        pciutils \
        bind9-host \
        bc \
        libssl-dev \
        sudo \
        dkms \
        net-tools \
        iproute2 \
        software-properties-common \
        git \
        vim \
        wget \
        curl \
        make \
        jq \
        psmisc \
        python \
        python-dev \
        python-yaml \
        python-jinja2 \
        python-urllib3 \
        python-tz \
        python-nose \
        python-prettytable \
        python-netifaces \
        python-pip \
        realpath \
        gawk \
        module-init-tools \
        # For MLNX OFED
        ethtool \
        lsof \
        python-libxml2 \
        quilt \
        libltdl-dev \
        dpatch \
        autotools-dev \
        graphviz \
        autoconf \
        chrpath \
        swig \
        automake \
        tk8.4 \
        tcl8.4 \
        libgfortran3 \
        tcl \
        gfortran \
        libnl-3-200 \
        libnl-3-dev \
        libnl-route-3-200 \
        libnl-route-3-dev \
        libcr-dev \
        libcr0 \
        pkg-config \
        flex \
        debhelper \
        bison \
        tk \
        libelf-dev \
        libaudit-dev \
        libslang2-dev \
        libgtk2.0-dev \
        libperl-dev \
        liblzma-dev \
        libnuma-dev \
        libglib2.0-dev \
        libnuma1 \
        libtool \
        libdw-dev \
        libiberty-dev \
        libunwind8-dev \
        binutils-dev && \
    pip install subprocess32 && \
    add-apt-repository -y ppa:ubuntu-toolchain-r/test && \
    mkdir -p $STAGE_DIR

WORKDIR $STAGE_DIR

ENV NVIDIA_VERSION=418.56 \
    OFED_VERSION=4.2-1.2.0.0 \
    OS_VERSION=ubuntu16.04 \
    ARCHITECTURE=x86_64

ENV MLNX_OFED_STRING=MLNX_OFED_LINUX-${OFED_VERSION}-${OS_VERSION}-${ARCHITECTURE}

RUN wget --no-verbose http://us.download.nvidia.com/XFree86/Linux-x86_64/$NVIDIA_VERSION/NVIDIA-Linux-x86_64-$NVIDIA_VERSION.run && \
    chmod 750 ./NVIDIA-Linux-x86_64-$NVIDIA_VERSION.run && \
    ./NVIDIA-Linux-x86_64-$NVIDIA_VERSION.run --extract-only && \
    rm ./NVIDIA-Linux-x86_64-$NVIDIA_VERSION.run

RUN echo "wget -q -O - http://www.mellanox.com/downloads/ofed/MLNX_OFED-$OFED_VERSION/$MLNX_OFED_STRING.tgz | tar xzf -" && \
    wget -q -O - http://www.mellanox.com/downloads/ofed/MLNX_OFED-$OFED_VERSION/$MLNX_OFED_STRING.tgz | tar xzf - && \
    echo "wget -q -O - http://www.mellanox.com/downloads/ofed/nvidia-peer-memory_1.0.5.tar.gz | tar xzf -" && \
    wget -q -O - http://www.mellanox.com/downloads/ofed/nvidia-peer-memory_1.0.5.tar.gz | tar xzf - && \
    git clone https://github.com/NVIDIA/gdrcopy.git

RUN cd $MLNX_OFED_STRING/DEBS && \
    for dep in libibverbs1 libibverbs-dev ibverbs-utils libmlx4-1 libmlx5-1 librdmacm1 librdmacm-dev libibumad libibumad-devel libibmad libibmad-devel libopensm infiniband-diags mlnx-ofed-kernel-utils; do \
        dpkg -i $dep\_*_amd64.deb && \
	dpkg --contents $dep\_*_amd64.deb | while read i; do \
	    src="/$(echo $i | cut -f6 -d' ')" && \
	    dst="$STAGE_DIR/$MLNX_OFED_STRING/usermode$(echo $src | sed -e 's/\.\/usr//' | sed -e 's/\.\//\//')" && \
	    (([ -d $src ] && mkdir -p $dst) || \
	     ([ -h $src ] && cd $(dirname $dst) && ln -s -f $(echo $i | cut -f8 -d' ') $(basename $dst) && cd $STAGE_DIR/$MLNX_OFED_STRING/DEBS) || \
	     ([ -f $src ] && cp $src $dst) \
	    ); \
	done; \
    done

COPY build/* $STAGE_DIR/
RUN chmod a+x enable-nvidia-persistenced-mode.sh install-all-drivers install-gdr-drivers install-ib-drivers install-nvidia-drivers

CMD /bin/bash install-all-drivers
