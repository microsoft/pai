FROM openpai/pai.example.cntk

# install git
RUN apt-get -y update && apt-get -y install git

# install Keras using pip
RUN pip install keras cntk-gpu

WORKDIR /root

ENV KERAS_BACKEND cntk

# clone Keras examples
RUN git clone https://github.com/keras-team/keras.git 

#if you want to build the docker image with data, please prepare the data first and remove the '#' in next line
#ADD data /root/.keras/ 

WORKDIR /root/keras/examples
