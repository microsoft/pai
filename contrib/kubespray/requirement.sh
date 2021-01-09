#!/bin/bash
set -e

while getopts "l:c:" opt; do
  case $opt in
    l)
      LAYOUT=$OPTARG
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

echo "layout file path: ${LAYOUT}"
echo "cluster config file path: ${CLUSTER_CONFIG}"

function cleanup(){
  rm -rf ${HOME}/pai-pre-check/
}

trap cleanup EXIT

mkdir -p ${HOME}/pai-pre-check/
python3 script/pre_check_generator.py -l ${LAYOUT} -c ${CLUSTER_CONFIG} -o ${HOME}/pai-pre-check

ansible-playbook -i ${HOME}/pai-pre-check/pre-check.yml environment-check.yml -e "@${CLUSTER_CONFIG}"
