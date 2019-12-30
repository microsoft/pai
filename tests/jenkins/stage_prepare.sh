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

# stop all docker containers
sudo docker stop $(sudo docker ps -q) || true
# remove all docker containers
sudo docker rm $(sudo docker ps -aq) || true
# remove all docker images
#sudo docker rmi $(sudo docker images -q | uniq) || true
# prune docker system
sudo docker system prune -f

# change permissions
sudo chown ${ACCOUNT_USR}:${ACCOUNT_USR} -R ${WORKSPACE}
sudo chown ${ACCOUNT_USR}:${ACCOUNT_USR} -R ${JENKINS_HOME}

# clean remote nodes
for host in $(seq -s " " -f "10.0.1.%g" 5 8) $(seq -s " " -f "10.0.3.%g" 4 6); do
  echo "clean node ${host}:"
  ssh ${ACCOUNT_USR}@${host} -o StrictHostKeyChecking=no -i /home/${ACCOUNT_USR}/.ssh/id_rsa \
  'sudo rm -rf /datastorage || true; \
   sudo rm -rf /mnt/datastorage || true; \
   sudo service stop kubelet || true; \
   sudo docker stop $(sudo docker ps -q) || true; \
   sudo docker system prune -af || true'
done

# start registry
ssh ${ACCOUNT_USR}@$(echo ${REGISTRY_URI} | cut -d: -f1) -o StrictHostKeyChecking=no -i /home/${ACCOUNT_USR}/.ssh/id_rsa \
  sudo docker run -d \
  --name registry2 \
  --restart unless-stopped \
  -p $(echo ${REGISTRY_URI} | cut -d: -f2):5000 \
  -e REGISTRY_HTTP_ADDR=0.0.0.0:5000 \
  -v /var/lib/docker/registry/data:/var/lib/registry \
  registry:2 || true
