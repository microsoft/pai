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

FROM ubuntu:16.04


RUN apt-get -y update && \
    apt-get -y install \
      samba \
      attr \
      cifs-utils \
      nfs-common \
      netbase \
      nfs-kernel-server \
      kmod

ENV SHARE_ROOT=/share/pai

COPY deploy/conf/exports /etc/exports
COPY deploy/scripts/sambadatacreate /usr/bin/sambadatacreate
COPY deploy/scripts/sambauserhomecreate /usr/bin/sambauserhomecreate
COPY deploy/scripts/entrypoint.sh /usr/bin/entrypoint.sh
COPY deploy/scripts/check.sh /usr/bin/check.sh

RUN chmod +x /usr/bin/sambadatacreate && \
    chmod +x /usr/bin/sambauserhomecreate && \
    chmod +x /usr/bin/entrypoint.sh && \
    chmod +x /usr/bin/check.sh

ENTRYPOINT ["/usr/bin/entrypoint.sh"]
