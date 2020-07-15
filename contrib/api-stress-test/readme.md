#### What can this playbooks do

1: Setup OpenPAI Cluster with branch name and image tag

2: Setup virtual-kubelet, and join them into OpenPAI Cluster. 

3: Setup Locust Cluster with distributed mode depending on kubernetes. 1 master + N worker.


#### Environment Prepare

1: Kubernetes Cluster. (1 master + N worker)

2: Several VMs to deploy virtual-kubelet. 


#### Before starting the stress test playbooks to setup environment.

1. Please create a new branch based on your dev branch and modify rest-server's code for vk scheduling.

Please modify your job config code as the following link

- Example Commit link: https://github.com/microsoft/pai/commit/6978bfa9f83a591335c3718db7670fd26776b87a


2. Build image and push them into a registry 


3. Setup Vars in ansible-playbooks based on your image registry and branch

```
docker_registry_namespace: openpai

docker_registry_domain: docker.io

docker_registry_tag: stresstest

#docker_registry_username: exampleuser

# docker_registry_password: examplepass

openpai_branch_name: stress-test
```

#### Write Inventory

[examplefile](./inventory/example.yml)

virtual-kubelet: 
- The group to deploy virtual kubelet

kube-master: 
- The group to deploy OpenPAI master. 
- The group tp deploy locust master
- Kubernetes should be already running on it
- Only support 1 node

kube-worker
- The group to deploy locust worker
- Kubernetes should be already running on it.

#### Vars to customize environment

vk_per_host
- The number of vk in a host. Default 100

stress_vk_proportion
- The proportion of the node in stress vc. The rest will be default vc. Default 0.5

docker_registry_namespace
- default openpai

docker_registry_domain
- default docker.io

docker_registry_tag
- default stresstest

docker_registry_username
- Necessary if your images are in private registry

docker_registry_password
- Necessary if your images are in private registry

openpai_branch_name
- The name of the branch to build the image. Default: stress-test

kube_config_path
- The path to the kubconfig. Default `{{local_home_path}}/.kube/config`

stress_test_openpai_job_list_enable
- default true

stress_test_openpai_job_submit_enable
- default false

stress_test_k8s_pod_list_enable
- default true

customized_locust_stress_script
- If you wanna use your own locust stress test script, please set this vars. /path/test.py

locust_worker_number
- The number of locust worker. Default value equals to the length of kube-worker group"

#### Running playbooks

##### Start Virtual-kubelet and locust
```
ansible-playbook -i host.yml virtual-kubelet.yml [-e "@path/to/env.yml"]
```

This playbooks will take some time to be complated. Because vk will be added into the cluster one by one. Please ensure all the vk is added into the cluster, then go to the next steps.

##### Start OpenPAI test cluster

```
ansible-playbook -i host.yml openpai.yml [-e "@path/to/env.yml"]
```

##### Start Locust Cluster

```
ansible-playbook -i host.yml locust.yml [-e "@path/to/env.yml"]
```

#### After running the playbooks

Loucst url: http://${kube-master}:8089

OpenPAI url: https://${kube-master}

OpenPAI user: stress

OpenPAI user password: stress1234


#### Auto test script.

Please refer to https://github.com/locustio/locust/blob/master/locust/web.py find the api of locust.