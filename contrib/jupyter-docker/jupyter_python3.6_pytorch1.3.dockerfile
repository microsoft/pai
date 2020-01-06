FROM pytorch/pytorch:1.3-cuda10.1-cudnn7-runtime

RUN pip install jupyter

RUN mkdir -p /pai_jupyter

WORKDIR /pai_jupyter