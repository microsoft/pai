<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

# Install necessary dependency

**Notice**, replace version number in below script to latest release's version, which can be found [here](https://github.com/Microsoft/pai/releases). For example, latest release is 0.9.5, so the git command should be `git clone -b v0.9.5 https://github.com/Microsoft/pai.git`

```bash
apt-get -y update

apt-get -y install \
      nano \
      vim \
      joe \
      wget \
      curl \
      jq \
      gawk \
      psmisc \
      python \
      python-yaml \
      python-jinja2 \
      python-urllib3 \
      python-tz \
      python-nose \
      python-prettytable \
      python-netifaces \
      python-dev \
      python-pip \
      python-mysqldb \
      openjdk-8-jre \
      openjdk-8-jdk \
      openssh-server \
      openssh-client \
      git \
      bash-completion \
      inotify-tools \
      rsync \
      realpath \
      net-tools \
      python3-pip

pip install --upgrade python-etcd docker kubernetes paramiko==2.6.0 GitPython future

pip3 install kubernetes

python -m easy_install --upgrade pyOpenSSL

# replace version number to latest, like v0.9.5.
git clone -b v0.x.y https://github.com/Microsoft/pai.git
```
