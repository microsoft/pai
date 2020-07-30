#!/bin/bash

sudo docker exec -i stress-dev-box /bin/bash << EOF_DEV_BOX

{% for host in groups['kube-worker'] %}
kubectl --kubeconfig=${KUBECONFIG} label nodes {{ hostvars[host].inventory_hostname }} no-jobexporter-
{% endfor %}

cd /root/pai

echo -e "Y\npai\n"  | python paictl.py service delete

kubectl delete configmap

EOF_DEV_BOX

docker stop stress-dev-box
docker rm stress-dev-box