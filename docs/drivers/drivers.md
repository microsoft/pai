## Drivers Maintenance 

#### How to upgrade the Nvidia drivers in your cluster


###### Available GPU drivers version in OpenPAI

```
"384.111"  (Default Value)
```

In the [path](../../src/drivers/build), you can find the available version in the following format. And you can choose one as the drivers version in your cluster.
```
drivers-${version}.dockerfile
``` 

###### Cluster Configuration

- Choose an available version in Openpai, and change the ```drivers``` section in ```service-configuration.yaml```.  

- Update the configuration in your cluster with the command ```paictl config push```. If you wanna investigate more detail about this command, please refer to this [link](../paictl/paictl-manual.md#Config_Push) 

###### Stop corresponding service

- Delete hadoop-node-manager
    - Note: all running jobs will be killed and retry after upgrading
       
```
./paictl service delete -n hadoop-node-manager
```

   
- Stop monitoring service

```
./paictl service stop -n node-exporter
```

- Delete drivers service

```
./paictl service stop -n drivers
```


- Delete end-to-end-test
```
./paictl service delete -n end-to-end-test
```

###### Starting drivers with the latest configuration

```
./paictl service start -n drivers
```

###### Starting other service
```
./paictl service start -n hadoop-node-manager
./paictl service start -n node-exporter
./paictl service start -n end-to-end-test
```

