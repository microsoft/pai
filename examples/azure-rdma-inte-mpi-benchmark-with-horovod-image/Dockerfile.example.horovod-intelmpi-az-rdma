# Tag: nvidia/cuda:9.0-cudnn7-devel-ubuntu16.04
# Label: com.nvidia.cuda.version: 9.0.176
# Label: com.nvidia.cudnn.version: 7.1.2.21
# Label: com.nvidia.volumes.needed: nvidia_driver
# Label: maintainer: NVIDIA CORPORATION <cudatools@nvidia.com>
# Ubuntu 16.04
FROM nvidia/cuda@sha256:40db1c98b66e133f54197ba1a66312b9c29842635c8cba5ae66fb56ded695b7c

ENV TENSORFLOW_VERSION=1.12.0

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
      python-dev \
      python-pip \
      python3 \
      python3-dev \
      python3-pip \
      # SSH library is necessary for mpi workload.
      openssh-server \
      openssh-client \
      build-essential \
      autotools-dev \
      cmake \
      git \
      bash-completion \
      ca-certificates \
      inotify-tools \
      rsync \
      realpath \
      libjpeg-dev \
      libpng-dev \
      net-tools \
      libsm6 \
      libxext6 \
      rpm \
      #For Azure RDMA and intel MPI installation
      cpio \
      net-tools \
      libdapl2 \
      dapl2-utils \
      libmlx4-1 \
      libmlx5-1 \
      ibutils \
      librdmacm1 \
      libibverbs1 \
      libmthca1 \
      ibverbs-utils \
      rdmacm-utils \
      perftest \
      kmod


# Install NCCL v2.3.7, for CUDA 9.0
RUN wget https://developer.download.nvidia.com/compute/machine-learning/repos/ubuntu1604/x86_64/nvidia-machine-learning-repo-ubuntu1604_1.0.0-1_amd64.deb && \
    dpkg -i nvidia-machine-learning-repo-ubuntu1604_1.0.0-1_amd64.deb && \
    apt install libnccl2=2.3.7-1+cuda9.0 libnccl-dev=2.3.7-1+cuda9.0


# Install intel MPI with the version which azure suggests.
COPY silent.cfg /silent.cfg
ENV MANPATH=/usr/share/man:/usr/local/man \
    COMPILERVARS_ARCHITECTURE=intel64 \
    COMPILERVARS_PLATFORM=linux \
    INTEL_MPI_PATH=/opt/intel/compilers_and_libraries/linux/mpi

# Install Intel MPI in the Docker Image.
# You should prepare your own intel mpi license to active your intel MPI, and modify the file silent.cfg to set the configuration of activation type.
RUN wget http://registrationcenter-download.intel.com/akdlm/irc_nas/tec/9278/l_mpi_p_5.1.3.223.tgz && \
    tar -xvf /l_mpi_p_5.1.3.223.tgz && \
    cd /l_mpi_p_5.1.3.223 && \
    ./install.sh -s /silent.cfg && \
    . /opt/intel/bin/compilervars.sh && \
    . /opt/intel/compilers_and_libraries/linux/mpi/bin64/mpivars.sh && \
    echo "source /opt/intel/compilers_and_libraries/linux/mpi/bin64/mpivars.sh" >> /root/.bashrc && \
    echo LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:'$LD_LIBRARY_PATH' >> /root/.bashrc

ENV PATH $PATH:/opt/intel/compilers_and_libraries/linux/mpi/bin64

# Install TensorFlow
RUN pip3 install tensorflow-gpu==${TENSORFLOW_VERSION} h5py && \
    pip install tensorflow-gpu==${TENSORFLOW_VERSION} h5py

# Install Dependencies
RUN pip3 install --no-cache-dir scipy jupyter ipykernel numpy toolz pandas scikit-learn pillow && \
    pip install --no-cache-dir scipy numpy toolz pandas scikit-learn pillow

# Install Horovod, temporarily using CUDA stubs
RUN ldconfig /usr/local/cuda-9.0/targets/x86_64-linux/lib/stubs && \
	/bin/bash -c "source /opt/intel/compilers_and_libraries/linux/mpi/intel64/bin/mpivars.sh" && \
    pip3 install --no-cache-dir horovod==0.15.2 && \
    pip install --no-cache-dir horovod==0.15.2 && \
    ldconfig