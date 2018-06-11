## Maintain your service <a name="Service"></a>

- [ Maintain your service ](#Service)
    - [ Start service in the cluster ](#Service_Start)
    - [ Stop service in the cluster ](#Service_Stop)
    - [ Delete (Stop and clean Data) Service in the cluster ](#Service_Delete)

#### Start service in the cluster <a name="Service_Start"></a>

```
paictl.py service start -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Starting all service in your cluster.
2) If the option -n is set, only the target service will be deployed.


#### Stop service in the cluster <a name="Service_Stop"></a>

```
paictl.py service stop -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Stop all service in your cluster.
2) If the option -n is set, only the target service will be stopped.


#### Delete (Stop and clean Data) Service in the cluster <a name="Service_Delete"></a>

```
paictl.py service delete -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Firstly, it will stop all service on your cluster.
2) Secondly, it will delete all service data which has been persistenced on the local host such as hdfs, yarn, zookeeper etc.
3) If the option -n is set, only the target service will be stopped and deleted.


#### Fresh Service in the cluster <a name="Service_Delete"></a>

```
paictl.py service refresh -p /path/to/cluster-configuration/dir [ -n service-name ]
```

1) Update the configmap
2) Remove the machine's label without the service
3) re-label the machine with the service



