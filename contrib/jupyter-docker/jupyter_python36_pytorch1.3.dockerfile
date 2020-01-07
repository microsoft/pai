FROM pytorch/pytorch:1.2-cuda10.0-cudnn7-runtime

RUN pip install jupyter

RUN mkdir -p /pai_jupyter

WORKDIR /pai_jupyter