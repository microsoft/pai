#!/bin/bash

#constants
source .env
resource="drbdha"
_smb_name="paismb"
hostname=$(hostname)
_docker_adm="/usr/bin/docker"
_nfs_adm="/etc/init.d/nfs-kernel-server"
_drbd_adm="/sbin/drbdadm"
_mount="/bin/mount"
_umount="/bin/umount"
error="error"

writelogs() {
  local curtime=$(date "+%F-%H:%M:%S")
  echo "${curtime} [${hostname}] $@" &>> "/var/log/drbdha/actions.log"
}

checkDRBD() {
  local status=$(${_drbd_adm} cstate ${resource})
  writelogs "checkDRBD: " "DRBD Status is ${status}"
  if [[ "${status}" != "Connected" ]] && [[ "${status}" != "SyncSource" ]];then
    writelogs "checkDRBD: " "DRBD Status failed"
    error=${error}" DRBD failed"
    return 1
  else
    writelogs "checkDRBD: " "DRBD Status succeeded"
    return 0
  fi
}

checkNFS() {
  ${_nfs_adm} status &>> /dev/null
  local status=$?
  writelogs "checkNFS: " "NFS Status is ${status}"
  if [[ "${status}" != "0" ]];then
    writelogs "checkNFS: " "NFS Status failed"
    error=${error}" NFS failed"
    return 1
  else
    writelogs "checkNFS: " "NFS Status succeeded"
    return 0
  fi
}

checkSMB() {
  local status=$(${_docker_adm} inspect --format '{{.State.Running}}' ${_smb_name})
  writelogs "checkSMB: " "SMB Status is ${status}"
  if [[ "${status}" != "true" ]];then
    writelogs "checkSMB: " "SMB Status failed"
    error=${error}" SMB failed"
    return 1
  else
    writelogs "checkSMB: " "SMB Status succeeded"
    return 0
  fi
}

checkStatus() {
  writelogs "-----------------"
  checkDRBD
  checkNFS
  checkSMB
  if [[ "${error}" != "error" ]]; then
    writelogs "checkStatus: " ${error}
    writelogs "chaha.timer: stopped"
    if [ -f "/etc/drbdha/sendha.py" ];then
      python3 /etc/drbdha/sendha.py ${hostname} CHKERROR
    fi
    systemctl stop chkha.timer
  else
    writelogs "checkStatus: " "All services succeeded"
  fi
}

checkStatus
