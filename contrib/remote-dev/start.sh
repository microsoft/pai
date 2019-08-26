#!/bin/bash

set -e
if [[ $1 = "DEBUG" ]];then
  set -x
fi

source ../.env
jobname=remote_dev_${RANDOM}_${RANDOM}

read_input() {
  while true; do
    read -p "Do you wish to continue (y/n)?" yn
    case $yn in
      [Yy]* ) break;;
      [Nn]* ) exit;;
      * ) echo "Do you wish to continue (y/n)?";;
    esac
  done
}

log_output() {
  local curtime=$(date "+%F %H:%M:%S.%N")
  echo -e "\033[33m${curtime} REMOTE_DEV: $@\033[0m" 
}

log_output "Generate conf files"
envsubst < ../conf/clusters.template > ../conf/clusters.yaml
envsubst < ../conf/job.template > ../conf/job.yaml

log_output "Copy conf files"
cp ../conf/clusters.yaml ~/.openpai
cp ../conf/job.yaml ~/.openpai
cp ../conf/exports.template ~/.openpai

log_output "Display PAI conf"
opai cluster list
read_input

log_output "RUN nfs server container"
docker stop remote_dev_nfs &> /dev/null || true
docker rm remote_dev_nfs &> /dev/null || true
docker run -itd --privileged --cap-add SYS_ADMIN --cap-add SYS_MODULE \
  -v /lib/modules:/lib/modules:ro \
  -v ${share}:/workspace \
  -v ~/.openpai/exports.template:/etc/exports:ro\
  -p 2049:2049 --name remote_dev_nfs \
  erichough/nfs-server
sleep 5

log_output "Submit job"
opai job submit -a remote_dev_bed --update name=${jobname} ~/.openpai/job.yaml
log_output "Your remote dev job name is ${jobname}."

log_output "Check job status"
while true; do
  state=$(opai job list -a remote_dev_bed ${jobname} | grep "state:" | awk '{ print $2 }')
  if [[ ${state} = "WAITING" ]]; then
    log_output "Wait for the job to start in PAI"
    sleep 10
  else
    break;
  fi
done
state=$(opai job list -a remote_dev_bed ${jobname} | grep "state:" | awk '{ print $2 }')
if [[ ${state} = "RUNNING" ]]; then
  log_output "Job started"
else
  log_output "Job status is ${state}, something went wrong"
  exit
fi

log_output "Download SSH key"
sshlink=$(opai job list -a remote_dev_bed ${jobname} ssh | grep "privateKeyDirectDownloadLink:" | awk '{ print $2 }')
if [[ -z ${sshlink} ]];then 
  log_output "No SSH key found"
  exit
fi
wget ${sshlink} -O ~/.openpai/${jobname}.key
chmod 600 ~/.openpai/${jobname}.key
log_output "SSH key named ${jobname}.key has been downloaded to ~/.openpai"

log_output "SSH into PAI container"
sship=$(opai job list -a remote_dev_bed ${jobname} ssh | grep "sshIp:" | awk '{ print $2 }')
sshport=$(opai job list -a remote_dev_bed ${jobname} ssh | grep "sshPort:" | awk '{ print $2 }' | sed $'s/\'//g')
if [[ -z ${sship} ]] || [[ -z ${sshport} ]];then
  log_output "Get sship and sshport failed"
  exit
fi
log_output "SSH IP: ${sship}"
log_output "SSH Port: ${sshport}"
log_output "SSH Key: ~/.openpai/${jobname}.key"
log_output "SSH CMD: ssh -i ~/.openpai/${jobname}.key -p ${sshport} root@${sship}\"
log_output "SSH into your container..."
read_input
ssh -i ~/.openpai/${jobname}.key -p ${sshport} root@${sship}
