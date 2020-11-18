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

OPENPAI_BRANCH_NAME=`cat ${CLUSTER_CONFIG} | grep branch_name | tr -d "[:space:]" | cut -d ':' -f 2`
OPENPAI_IMAGE_TAG=`cat ${CLUSTER_CONFIG} | grep docker_image_tag | tr -d "[:space:]" | cut -d ':' -f 2`

echo "Branch Name ${OPENPAI_BRANCH_NAME}"
echo "OpenPAI Image Tag ${OPENPAI_IMAGE_TAG}"

function cleanup(){
  sudo docker stop dev-box-quick-start &> /dev/null
  sudo docker rm dev-box-quick-start &> /dev/null
}

cleanup

sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v ${HOME}/pai-deploy/quick-start-config/:/quick-start-config \
        -v ${HOME}/pai-deploy/cluster-cfg:/cluster-configuration  \
        -v ${HOME}/pai-deploy/kube:/root/.kube \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box-quick-start \
        openpai/dev-box:${OPENPAI_IMAGE_TAG}

sudo docker exec -it dev-box-quick-start kubectl get node || { cleanup; exit 1; }

# Work in dev-box
sudo docker exec -i dev-box-quick-start /bin/bash << EOF_DEV_BOX
set -e

echo "starting nvidia device plugin to detect nvidia gpu resource"
svn cat https://github.com/NVIDIA/k8s-device-plugin.git/tags/1.0.0-beta4/nvidia-device-plugin.yml \
  | kubectl apply --overwrite=true -f -
sleep 5

echo "starting AMD device plugin to detect AMD gpu resource"
svn cat https://github.com/RadeonOpenCompute/k8s-device-plugin.git/trunk/k8s-ds-amdgpu-dp.yaml \
  | kubectl apply --overwrite=true -f -
sleep 5

cd /pai && git checkout ${OPENPAI_BRANCH_NAME}
python3 /pai/contrib/kubespray/script/openpai-generator.py -m /quick-start-config/master.csv -w /quick-start-config/worker.csv -c /quick-start-config/config.yml -o /cluster-configuration

kubectl delete ds nvidia-device-plugin-daemonset -n kube-system
kubectl delete ds amdgpu-device-plugin-daemonset -n kube-system
sleep 5

# TODO: This should be done at our source code.
kubectl create namespace pai-storage

# 1. Push cluster config to cluster
echo -e "pai\n" | python /pai/paictl.py config push -p /cluster-configuration -m service

# 2. Start OpenPAI service
echo -e "pai\n" | python /pai/paictl.py service start
EOF_DEV_BOX

if [ $? -ne 0 ]; then
  cleanup
  exit 1
else
  cleanup
  WEBPORTAL_URL=http:$(kubectl config view -o jsonpath='{.clusters[].cluster.server}' | cut -d ":" -f 2)
  echo ""
  echo "OpenPAI is successfully deployed, please check the following information:"
  echo "Kubernetes cluster config :     ~/pai-deploy/kube/config"
  echo "OpenPAI cluster config    :     ~/pai-deploy/cluster-cfg"
  echo "OpenPAI cluster ID        :     pai"
  echo "Default username          :     admin"
  echo "Default password          :     admin-password"
  echo ""
  echo "You can go to ${WEBPORTAL_URL}, then use the default username and password to log in."
fi
