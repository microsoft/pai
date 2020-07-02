#### Before starting the stress test playbooks to setup environment.

1. Please create your own branch and modify rest-server's code for vk scheduling.

- Remove the following line

Line: https://github.com/microsoft/pai/blob/master/src/rest-server/src/models/v2/job/k8s.js#L465

- add the toleration configuration after this line.

Line: https://github.com/microsoft/pai/blob/master/src/rest-server/src/models/v2/job/k8s.js#L416

Toleration:
```Yaml
tolerations: [
    {
      key: "virtual-kubelet.io/provider",
      operator: "Equal",
      value: "mock",
      effect: "NoSchedule",
    }
]
```

2. Build image and push them into a registry 

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

docker_registry_password: example
- Necessary if your images are in private registry

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

```
ansible-playbook -i host.yml stress.yml [-e "@path/to/env.yml"]
```

#### After running the playbooks

Loucst url: http://${kube-master}:8089
OpenPAI url: https://${kube-master}
OpenPAI user: stress
OpenPAI user password: stress1234