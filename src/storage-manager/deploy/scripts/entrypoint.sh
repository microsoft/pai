#!/bin/bash

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

# copy smb.conf
echo "copy smb.conf ----------"
cp /etc/pai-config/smb.conf /etc/samba/smb.conf

# install krb5 and join domain
if [[ $SECURETYPE == "ADS" ]]; then
  echo "install krb5 ----------"
  cp /etc/pai-config/krb5.conf /etc/krb5.conf
  cp /etc/pai-config/nsswitch.conf /etc/nsswitch.conf
  apt update && apt install -y \
    winbind \
    libpam-winbind \
    libnss-winbind \
    libpam-krb5 \
    krb5-config \
    krb5-user
  echo "join domain ----------"
  net ads join -U "$DOMAINUSER"%"$DOMAINPWD"
  echo "domain info ----------"
  net ads info
fi

# create folders
echo "create folders ----------"
mkdir -p /share/pai/data
mkdir -p /share/pai/users

# load nfs modules
echo "load nfs modules ----------"
modprobe nfs
modprobe nfsd

# restart services
echo "restart services ----------"
if [[ $SECURETYPE == "ADS" ]]; then
  service winbind restart
fi
service smbd restart
service rpcbind restart
service nfs-kernel-server restart

# add paismbuser
echo "add paismbuser ----------"
useradd $PAISMBUSER
(echo $PAISMBPWD && echo $PAISMBPWD) | ./usr/bin/smbpasswd -a $PAISMBUSER

# sleep
echo "sleep infinity ----------"
sleep infinity
