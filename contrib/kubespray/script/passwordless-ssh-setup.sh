#!/bin/bash

while getopts "c:" opt; do
  case $opt in
    c)
      CLUSTER_CONFIG=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG"
      exit 1
      ;;
  esac
done

cd ${HOME}/pai-deploy/pai/contrib/kubespray

echo "Generate SSH Key"

rm -rf ${HOME}/.ssh/known_hosts

ssh-keygen -t rsa -f ~/.ssh/id_rsa -P ""

LOCAL_USER=`whoami`
REMOTE_USER=`cat ${CLUSTER_CONFIG} | grep user | tr -d "[:space:]" | cut -d ':' -f 2`

cp ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml.template ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml
sed  -i "s/%REMOTE_USER%/${REMOTE_USER}/g" ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml
sed  -i "s/%LOCAL_USER%/${LOCAL_USER}/g" ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml

ansible-playbook -i ${HOME}/pai-deploy/cluster-cfg/hosts.yml ${HOME}/pai-deploy/pai/contrib/kubespray/quick-start/set-passwordless-ssh.yml
