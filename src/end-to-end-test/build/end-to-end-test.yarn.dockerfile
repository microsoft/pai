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

FROM hadoop-run

RUN apt-get -y update && \
    apt-get -y install python git jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /root/end-to-end-test

COPY etc /root/end-to-end-test/etc/
COPY *.sh /root/end-to-end-test/


RUN git clone https://github.com/sstephenson/bats.git && \
    cd bats && \
    ./install.sh /usr/local

RUN wget http://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz
RUN tar zxvf cifar-10-python.tar.gz
RUN rm cifar-10-python.tar.gz
RUN git clone -b tf_benchmark_stage https://github.com/tensorflow/benchmarks.git

CMD ["/bin/bash", "/root/end-to-end-test/start.sh"]
