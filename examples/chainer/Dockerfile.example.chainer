FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

#set LC_ALL
ENV LC_ALL C

# install git
RUN apt-get -y update && apt-get -y install git

# install Chainer and cupy using pip
RUN pip install chainer && pip install cupy-cuda80

# clone Chainer official code
RUN git clone https://github.com/chainer/chainer.git
