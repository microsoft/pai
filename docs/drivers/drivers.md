## Drivers Maintenance 

#### How to upgrade the Nvidia drivers in your cluster


###### Available GPU drivers version in OpenPAI

```yaml
"384.111"  (Default Value)
```


###### Cluster Configuration

- Choose an available version in Openpai, and change the ```drivers``` section in ```service-configuration.yaml```.  

- Update the configuration in your cluster with the command ```paictl config push```. If you wanna investigate more detail about this command, please refer to this [link](../paictl/paictl-manual.md#Config_Push) 

###### Stop corresponding service

- Delete hadoop-node-manager and delete all jobs
    - Note: all jobs will be killed
       
```yaml
./paictl service delete -n hadoop-node-manager
```

   
- Stop monitoring service

```yaml
./paictl service stop -n node-exporter
```

- Delete drivers service

```yaml
./paictl service stop -n drivers
```


- Delete end-to-end-test
```yaml
./paictl service delete -n end-to-end-test
```

###### Starting drivers with the latest configuration

```yaml
./paictl service start -n drivers
```

###### Starting other service
```yaml
./paictl service start -n hadoop-node-manager
./paictl service start -n node-exporter
./paictl service start -n end-to-end-test
```

