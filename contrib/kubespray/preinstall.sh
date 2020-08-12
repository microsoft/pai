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

echo "cluster config file path: ${CLUSTER_CONFIG}"

ABS_CONFIG_PATH="$(echo ${CLUSTER_CONFIG})"
echo "Config path is: ${ABS_CONFIG_PATH}"
ansible-playbook -i ${HOME}/pai-pre-check/pre-check.yml set-host-daemon-port-range.yml -e "@${ABS_CONFIG_PATH}"
ret_code_check=$?

if [ $ret_code_check -eq 0 ]
then
  echo "Preinstall script finished succssfully"
else
  echo "Preinstall script exited with error"
  exit $ret_code_check
fi
