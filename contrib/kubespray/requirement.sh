#!/bin/bash

while getopts "w:m:c:" opt; do
  case $opt in
    w)
      WORKER_LIST=$OPTARG
      ;;
    m)
      MASTER_LIST=$OPTARG
      ;;
    c)
      CLUSTER_CONFIG=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG"
      exit 1
      ;;
  esac
done

echo "worker list file path: ${WORKER_LIST}"
echo "master list file path: ${MASTER_LIST}"
echo "cluster config file path: ${CLUSTER_CONFIG}"

mkdir -p ${HOME}/pai-pre-check/
python3 script/pre-check-generator.py -m ${MASTER_LIST} -w ${WORKER_LIST} -c ${CLUSTER_CONFIG} -o ${HOME}/pai-pre-check

ABS_CONFIG_PATH="$(echo ${CLUSTER_CONFIG})"
echo "Config path is: ${ABS_CONFIG_PATH}"
ansible-playbook -i ${HOME}/pai-pre-check/pre-check.yml environment-check.yml -e "@${ABS_CONFIG_PATH}"
ret_code_check=$?

if [ $ret_code_check -eq 0 ]
then
  echo "Pass: Cluster meets the requirements"
else
  echo "Faild: There are unmet requirements in your cluster, the installation will be very likely to fail."
  echo ""
  echo "Please press ENTER to stop the script, check the log, and modify the cluster setting to meet the requirements."
  echo "If you are very sure about the configuration, and still want to continue, you can type in \"continue\" to force the script to proceed."
  rm -rf ${HOME}/pai-pre-check/
  read user_input
  if [ "${user_input}"x = "continue"x ]; then
    exit 0
  else
    exit $ret_code_check
  fi
fi

rm -rf ${HOME}/pai-pre-check/

