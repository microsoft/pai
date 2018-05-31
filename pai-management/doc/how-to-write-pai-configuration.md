## Configuration

Before deploy or maintain pai on your cluster, you should finish configuring the cluster-configuration first.

Note: Don't change the name of the file. And those 4 files should be put in the same directory.


You could find the configuration in this path: [pai/cluster-configuration/][../../cluster-configuration]

## Index

- [cluster-configuration.yaml](#cluster_configuration)
- [k8s-role-definition.yaml](#k8s_role_definition)
- [kubernetes-configuration.yaml](#kubernetes_configuration)
- [serivices-configuration.yaml](#services_configuration)



## cluster-configuration.yaml <a name="cluster_configuration"></a>

#### ```default-machine-properties```

```YAML
default-machine-properties:
  # Account with root permission
  username: username
  password: password
  sshport: port
```

In this field, you could set the default value such as username, password and sshport. If those 3 properties is empty in your machine list, paictl will use the default value to ssh to your machine.

Note: The user should be with sudo permission.

#### ```machine-sku```

```YAML
machine-sku:

  NC24R:
    mem: 224
    gpu:
      type: teslak80
      count: 4
    cpu:
      vcore: 24
    #Note: Up to now, the only supported os version is Ubuntu16.04. Please do not change it here.
    os: ubuntu16.04

```

In this field, you could define several sku with different name. And in the machine list you should refer your machine to one of them.

- mem: memory
- gpu: If there is no gpu on this sku, you could remove this field
- os: Now we only supported ubuntu, and pai is only tested on the version 16.04LTS.

#### ```machine-list```

```
machine-list:

    - hostname: hostname (echo `hostname`)
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid1
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: master
      dashboard: "true"
      zkid: "1"
      pai-master: "true"



    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid2
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: master
      node-exporter: "true"
```