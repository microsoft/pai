#!/bin/bash

STATE=${1}

# constants
source .env
resource="drbdha"
DRBD_DEVICE="/dev/drbd0"
MOUNT_PATH='/data/share/drbdha'
logpath="/var/log/drbdha/actions.log"
hostname=$(hostname)
_docker_adm='/usr/bin/docker'
_docker_name='paismb'
_nfs_adm='/etc/init.d/nfs-kernel-server'
_drbd_adm='/sbin/drbdadm'
_mount='/bin/mount'
_umount='/bin/umount'

writelogs() {
  local curtime=$(date "+%F-%H:%M:%S")
  echo "${curtime} [${hostname}] $@" &>> ${logpath}
}

upgrade_drbd() {
  while true; do
    if ${_drbd_adm} primary ${resource} &>> $logpath; then
      [[ "$?" = "0" ]] && break
    fi
    writelogs 'drbd upgrading'
    sleep 1
  done
  writelogs 'drbd upgraded'
}

degrade_drbd() {
  while true; do
    writelogs 'drbd degrading'
    if ${_drbd_adm} secondary ${resource}  &>> $logpath; then
      [[ "$?" = "0" ]] && break
    fi
    sleep 1
  done
  writelogs 'drbd degraded'
}

start_smb() {
  ${_docker_adm} start ${_docker_name} &>> $logpath
  writelogs 'docker started'
}

stop_smb() {
  ${_docker_adm} stop ${_docker_name} &>> $logpath
  writelogs 'docker stoped'
}

start_nfs() {
  ${_nfs_adm} start &>> $logpath
  writelogs 'nfs started'
}

stop_nfs() {
  ${_nfs_adm} stop &>> $logpath
  writelogs 'nfs stoped'
}

mount_mountpath() {
  ${_mount} ${DRBD_DEVICE} ${MOUNT_PATH}  &>> $logpath
  writelogs 'mounted'
}

umount_mountpath() {
  ${_umount} ${MOUNT_PATH}  &>> $logpath
  writelogs 'unmounted'
}

change_to_master() {
  writelogs "changing to ${STATE}"
  upgrade_drbd
  mount_mountpath
  start_nfs
  start_smb
  writelogs "changed to ${STATE}"
}

change_to_backup() {
  writelogs "changing to ${STATE}"
  stop_nfs
  stop_smb
  umount_mountpath
  degrade_drbd
  writelogs "changed to ${STATE}"
}

writelogs "-----------------"
case ${STATE} in
  'MASTER')
    change_to_master
    ;;
  'BACKUP')
    change_to_backup
    ;;
  *)
    change_to_backup
    ;;
esac

if [ -f "/etc/drbdha/sendha.py" ];then
  python3 /etc/drbdha/sendha.py CHANGE_TO_${STATE} ${hostname}
fi
