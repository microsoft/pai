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

sed -i "/^JAVA_OPTS.*/ s:.*:JVMFLAGS=\"${JAVA_OPTS}\":" /usr/share/zookeeper/bin/zkEnv.sh

HOST_NAME=`hostname`

# create /etc/zookeeper/conf/zoo.cfg
echo "
tickTime=2000
dataDir=/var/lib/zoodata
clientPort=2181
initLimit=5
syncLimit=2
${ZK_SERVERS}
" > /etc/zookeeper/conf/zoo.cfg

# generate an unique zookeeper server id, it looks like "adc83b19"	# using the first 8 digits of sha1sum(ip)
echo $((0x$(echo -n $POD_IP | sha1sum | grep -Eo "[a-f0-9]{8}"  | head -n1))) > /var/lib/zoodata/myid

mkdir -p /jobstatus
touch /jobstatus/jobok

zkServer.sh start-foreground

