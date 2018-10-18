FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install git
RUN apt-get -y update && apt-get -y install git

# install scikit-learn using pip
RUN pip install numpy pandas scipy scikit-learn

# clone scikit-learn examples
RUN git clone https://github.com/scikit-learn/scikit-learn.git

#if you want to build the docker image with data, please prepare the data first and remove the '#' in next line
#ADD ./scikit_learn_data /root/scikit_learn_data

WORKDIR /root
