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

PAI_WORK_DIR=/usr/local/pai
SSH_DIR=/root/.ssh

function prepare_ssh()
{
  mkdir ${SSH_DIR}
  chmod 700 ${SSH_DIR}
  touch ${SSH_DIR}/authorized_keys
  chmod 644 ${SSH_DIR}/authorized_keys

  mkdir -p /var/run/sshd

# Set sshd config
  sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
  sed -i 's/Port.*/Port '$PAI_CONTAINER_SSH_PORT'/' /etc/ssh/sshd_config
  echo "PermitUserEnvironment yes" >> /etc/ssh/sshd_config

  sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

  echo "sshd:ALL" >> /etc/hosts.allow

# Set user environment
  env > ${SSH_DIR}/environment
}

function prepare_job_ssh()
{
# Job ssh files are mounted to /usr/local/pai/ssh-secret.
# Please refer to https://kubernetes.io/docs/concepts/configuration/secret/#use-case-pod-with-ssh-keys
  localPublicKeyPath=${PAI_WORK_DIR}/ssh-secret/ssh-publickey
  localPrivateKeyPath=${PAI_WORK_DIR}/ssh-secret/ssh-privatekey

  if [ -f $localPublicKeyPath ] && [ -f $localPrivateKeyPath ] ; then
    cat $localPublicKeyPath >> ${SSH_DIR}/authorized_keys

    cp $localPrivateKeyPath ${SSH_DIR}/id_rsa
    chmod 400 ${SSH_DIR}/id_rsa
  else
    echo "no job ssh keys found" >&2
  fi

# Set ssh config for all task role instances
  taskRoleInstanceArray=(${PAI_TASK_ROLE_INSTANCES//,/ })
  for i in "${taskRoleInstanceArray[@]}"; do
    instancePair=(${i//:/ })
    taskrole=${instancePair[0]}
    index==${instancePair[1]}
    printf "%s\n  %s %s\n  %s %s\n  %s\n  %s\n  %s\n  %s\n" \
      "Host ${taskrole}-${index}" \
      "HostName" \
	  `eval echo '$PAI_HOST_IP_'${taskrole}_${index}` \
      "Port" \PAI_{}_{}_{}_PORT
	  `eval echo '$PAI_'${taskrole}_${index}_ssh_PORT` \
      "User root" \
      "StrictHostKeyChecking no" \
      "UserKnownHostsFile /dev/null" \
      "IdentityFile /root/.ssh/" >> /etc/ssh/ssh_config
}

function prepare_user_ssh()
{
  if [ -z "$PAI_SSH_PUB_KEY" ] ; then
    echo "no user ssh key provided" >&2
  else
    echo "$PAI_SSH_PUB_KEY" >> ${SSH_DIR}/authorized_keys
  fi
}

function start_ssh()
{
  printf "%s %s\n" \
    "[INFO]" "start ssh service"
  service ssh restart
}

# Try to install openssh if sshd is not found
if [ ! -f /usr/sbin/sshd ] ; then
  apt-get update
  apt-get install -y openssh-client openssh-server
fi


if [ -f /usr/sbin/sshd ] ; then
    if [ -z "$PAI_CONTAINER_SSH_PORT" ] ; then
        echo "no ssh port provided" >&2
    else
        prepare_ssh
        prepare_job_ssh
        prepare_user_ssh
        start_ssh
    fi
else
    echo "no sshd binary found" >&2
fi
