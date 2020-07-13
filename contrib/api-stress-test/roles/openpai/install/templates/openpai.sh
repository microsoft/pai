#!/bin/bash

set -e

function cleanup(){
  docker stop stress-dev-box
  docker rm stress-dev-box
}

{% if docker_registry_username is defined and docker_registry_password is defined %}
docker login {{ docker_registry_domain }} -p {{ docker_registry_password }} -u {{ docker_registry_username }}
{% endif %}

docker run -tid \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v {{ base_dir_cfg }}:/cluster-configuration  \
      -v {{ kube_config_path }}:/root/.kube/config \
      --pid=host \
      --privileged=true \
      --net=host \
      --name=stress-dev-box \
      {{ docker_registry_domain }}/{{ docker_registry_namespace }}/dev-box:{{ docker_registry_tag }} /bin/bash

sudo docker exec -i stress-dev-box /bin/bash -c "kubectl get node" || { cleanup; exit 1; }

sudo docker exec -i stress-dev-box /bin/bash << EOF_DEV_BOX

{% for host in groups['kube-worker'] %}
kubectl --kubeconfig=${KUBECONFIG} label nodes {{ hostvars[host].inventory_hostname }} no-jobexporter=true
{% endfor %}

apt-get -y update
apt-get -y install subversion python3 python-dev software-properties-common parallel

curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py
pip3 install kubernetes==11.0.0b2 jinja2

cd /root
git clone https://github.com/microsoft/pai.git
cd pai

git checkout {{ openpai_branch_name }}

kubectl create namespace pai-storage

echo -e "pai\n" | python paictl.py config push -p /cluster-configuration -m service

echo -e "pai\n" | python paictl.py service start

EOF_DEV_BOX