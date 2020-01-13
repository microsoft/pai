#### Configuration prepare

- [layout.yaml](../../../examples/cluster-configuration/layout.yaml)
- [service.yaml](../../../examples/cluster-configuration/services-configuration.yaml)


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
git checkout ${branch-name}
```

#### Push configuration into k8s

```shell script
./paictl.py config push -p /cluster-configuration -m service
```

#### Start Openpai service

```shell script
./paictl.py service start
```




