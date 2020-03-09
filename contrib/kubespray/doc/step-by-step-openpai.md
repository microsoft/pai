#### Prepare configuration 

- layout.yaml
    - [layout.yaml example](../../../examples/cluster-configuration/layout.yaml)
    - [How to write a layout.yaml](../../../docs/pai-management/doc/how-to-configure-layout.md)
- service-configuration.yaml 
    - [service-configuration.yaml example](../../../examples/cluster-configuration/services-configuration.yaml)
    - [How to write a service-configuration.yaml](../../../docs/pai-management/doc/how-to-congiure-service-config.md)

#### Start up  dev-box

```shell script
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /path/to/cluster-cfg:/cluster-configuration  \
        -v ${HOME}/.kube:/root/.kube \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box-quick-start \
        openpai/dev-box:quick-start
```

#### Login the dev-box

```shell script
sudo docker exec -it dev-box-quick-start /bin/bash
```

#### Clone OpenPAI Code

```shell script
cd root/
git clone https://github.com/microsoft/pai.git
cd pai
git checkout ${branch_name}
```

#### Push configuration into k8s

```shell script
./paictl.py config push -p /cluster-configuration -m service
```

#### Start Openpai service

```shell script
./paictl.py service start
```




