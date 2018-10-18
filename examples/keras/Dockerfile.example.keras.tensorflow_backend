FROM openpai/pai.example.tensorflow:v1.10

# install git
RUN apt-get -y update && apt-get -y install git

# install Keras using pip
RUN pip install keras

WORKDIR /root

# clone Keras examples
RUN git clone https://github.com/keras-team/keras.git 

ENV KERAS_BACKEND tensorflow

#if you want to build the docker image with data, please prepare the data first and remove the '#' in next line
#ADD data /root/.keras/

WORKDIR /root/keras/examples
