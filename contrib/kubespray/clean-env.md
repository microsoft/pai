#### Clean cluster environment which is deployed OpenPAI before.


###### APT Issue

Please modify [the playbooks apt-fix.yml](./apt-fix.yml) based on your cluster. 

```bash

ansible-playbook -i /path/to/host.yml apt-fix.yml --become --become-user=root

```

###### Clean up nvidia-drivers installed by OpenPAI before

Please modify [the playbooks clean-nvidia-drivers-installed-by-paictl.yml](./clean-nvidia-drivers-installed-by-paictl.yml) based on your cluster. 

```bash

ansible-playbook -i /path/to/host.yml clean-nvidia-drivers-installed-by-paictl.yml --become --become-user=root

```

- Important, especially the step to rm docker daemon json 


###### Cleanup docker env

Please modify [the playbooks clean-docker.yml](./clean-docker.yml) based on your cluster.

```bash

ansible-playbook -i /path/to/host.yml clean-docker.yml --become --become-user=root

```


###### Manually clean the node which task failed, or you could run the script multiple times. 
