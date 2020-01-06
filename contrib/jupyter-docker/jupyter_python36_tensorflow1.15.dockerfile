FROM tensorflow/tensorflow:1.15.0-py3-jupyter

RUN mkdir -p /pai_jupyter

WORKDIR /pai_jupyter