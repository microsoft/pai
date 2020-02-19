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

RUN apt-get -y update && \
    apt-get -y install lsof gawk

RUN pip install psutil

RUN curl -SL https://download.docker.com/linux/static/stable/x86_64/docker-17.06.2-ce.tgz \
    | tar -xzvC /usr/local \
    && mv /usr/local/docker/* /usr/bin

ENV PYTHONPATH "${PYTHONPATH}:/"
RUN mkdir -p /cleaner
WORKDIR /cleaner

COPY scripts /cleaner/scripts
COPY utils /cleaner/utils
COPY ./*.py /cleaner/

ENTRYPOINT ["python", "/cleaner/cleaner_main.py"]
