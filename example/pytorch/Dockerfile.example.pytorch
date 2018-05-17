FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install git
RUN apt-get -y update && apt-get -y install git

# install PyTorch dependeces using pip
RUN pip install torch torchvision

# clone PyTorch examples
RUN git clone https://github.com/pytorch/examples.git
