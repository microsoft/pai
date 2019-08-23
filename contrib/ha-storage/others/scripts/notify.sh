#!/bin/bash

# parameters
# $(n-3) = "GROUP"|"INSTANCE"
# $(n-2) = name of the group or instance
# $(n-1) = target state of transition (stop only applies to instances)
#          ("MASTER"|"BACKUP"|"FAULT"|"STOP")
# $(n)   = priority value
TYPE=${1}         # "GROUP"|"INSTANCE"
NAME=${2}         # name of the group or instance
STATE=${3}        # "MASTER"|"BACKUP"|"FAULT"|"STOP"
PRIORITY=${4}     # priority value

# constants
logpath='/var/log/drbdha/actions.log'
drbddev='/dev/drbd0'
mountpath='/data/share/drbdha'
resource='nfs_ha_prod'
hostname=$(hostname)
_docker_adm='/usr/bin/docker'
_docker_name='paismb'
_nfs_adm='/etc/init.d/nfs-kernel-server'
_drbd_adm='/sbin/drbdadm'
_mount='/bin/mount'
_umount='/bin/umount'

writelogs() {
# writelogs [ROLE] [CONTENT]
  local curtime=$(date "+%F-%H:%M:%S")
  echo "${curtime} [${hostname}] ${1}" &>> $logpath
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
  ${_mount} ${drbddev} ${mountpath}  &>> $logpath
  writelogs 'mounted'
}

umount_mountpath() {
  ${_umount} ${mountpath}  &>> $logpath
  writelogs 'unmounted'
}

change_to_master() {
  writelogs "changing to ${STATE} with priority of ${PRIORITY} "
  upgrade_drbd
  mount_mountpath
  start_nfs
  start_smb
  writelogs "changed to ${STATE} with priority of ${PRIORITY} "
}

change_to_backup() {
  writelogs "changing to ${STATE} with priority of ${PRIORITY} "
  stop_nfs
  stop_smb
  umount_mountpath
  degrade_drbd
  writelogs "changed to ${STATE} with priority of ${PRIORITY} "
}

writelogs "TYPE: $TYPE | NAME: $NAME | STATE: $STATE | PRIORITY: $PRIORITY "

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

python3 /etc/keepalived/bin/sendemail.py CHANGE_TO_${STATE} ${hostname}
