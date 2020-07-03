#!/bin/bash

# install requirements
apt-get install -y jq moreutils

# install binary
chmod +x ./rocm-container-runtime
cp ./rocm-container-runtime /usr/bin/
cp ./rocm-container-runtime.conf /etc/
