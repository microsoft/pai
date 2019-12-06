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


FROM golang:1.12.6-alpine as builder

ENV PROJECT_DIR=${GOPATH}/src/github.com/microsoft/runtime
ENV INSTALL_DIR=/opt/kube-runtime

RUN apk update && apk add --no-cache bash && \
  mkdir -p ${PROJECT_DIR} ${INSTALL_DIR}
COPY GOPATH/src/github.com/microsoft/runtime/ ${PROJECT_DIR}
RUN ${PROJECT_DIR}/build/runtime/go-build.sh && \
  mv ${PROJECT_DIR}/dist/runtime/ ${INSTALL_DIR}

FROM python:3.7-alpine

RUN pip install pyyaml requests

ENV INSTALL_DIR=/opt/kube-runtime
ARG BARRIER_DIR=/opt/frameworkcontroller/frameworkbarrier

WORKDIR /kube-runtime/src

COPY src/ ./
COPY --from=frameworkcontroller/frameworkbarrier:v0.5.1 $BARRIER_DIR/frameworkbarrier ./init.d
COPY --from=builder ${INSTALL_DIR}/* ./runtime.d
RUN chmod -R +x ./

# This line should be removed after using k8s client to interact with api server
RUN apk update && apk add --no-cache curl

CMD ["/bin/sh", "-c", "set -o pipefail && LOG_DIR=/usr/local/pai/logs/${FC_POD_UID} && mkdir -p ${LOG_DIR} && /kube-runtime/src/init 2>&1 | tee -a ${LOG_DIR}/init.log"]
