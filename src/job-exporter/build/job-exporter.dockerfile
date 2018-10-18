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

FROM python:2.7

ENV NVIDIA_VERSION=current
ENV NV_DRIVER=/var/drivers/nvidia/$NVIDIA_VERSION
ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$NV_DRIVER/lib:$NV_DRIVER/lib64
ENV PATH=$PATH:$NV_DRIVER/bin

RUN curl -SL https://download.docker.com/linux/static/stable/x86_64/docker-17.06.2-ce.tgz \
    | tar -xzvC /usr/local \
    && mv /usr/local/docker/* /usr/bin
RUN apt-get update && apt-get install -y build-essential git iftop lsof

RUN git clone https://github.com/yadutaf/infilter --depth 1
RUN cd infilter && make
RUN cp infilter/infilter /usr/bin

RUN mkdir -p /job_exporter
COPY src/* /job_exporter/

CMD python /job_exporter/job_exporter.py /datastorage/prometheus 30
