## Deployment

This document will introduce following information to you.
- The design of service deployment
- How to add a new service based on paictl.

## Design


#### The deployment python module

<br/>

<div  align="center">
<img src="pic/service-deployment.jpg" alt="paictl overview picture" style="float: center; margin-right: 10px;" />
</div>

<br/>

service_management_${operator}:
- This part will receive a list of service which will be handle by corresponding operator.

service_${operator}:
- This part will receive a service name. And this service will handled by the target operator.


In the field ${operator}, we have implemented four options. They are:
- start: the module to deploy a service on kubernetes cluster.
- stop: the module to stop a service, but keep the persistent data.
- delete: the module to stop a service and delete the persistent data.
- refresh: the module to update the configuration for the service.
<br>

#### The component source code structure

<br/>

<div  align="center">
<img src="pic/deployment-component-path.jpg" alt="paictl overview picture" style="float: center; margin-right: 10px;" />
</div>

<br/>

The path ```pai/src/``` contains all the component provided by openPai. And only the component with the directory ```deploy/``` will be detected by service deployment module.

<br/>

A component's ```deploy/``` directory must have the file named ```service.yaml```. This file is the configuration for service deployment module. And this file should container following fields, some of them are optional.

<br>

An example of ```service.yaml```.
```yaml
prerequisite:
  - service-a
  - serivce-b

template-list:
  - filea.sh
  - fileb.yaml

start-script: start.sh
stop-script: stop.sh
delete-script: delete.sh
refresh-script: refresh.sh

deploy-rules:
  - in: pai-master
```


- prerequisite: Some services have external dependency. For example, in openpai, restserver will have to wait frameworklaucnher ready. Developers could define dependency rule for their component. And service deployment module will start the target service first.


- template-list: The file in the template-list should be contained in the path ```${component}/deploy/```. And if ```filea.sh``` is in the list, you should named the template file as the name ```filea.sh.template```. After generating, the new file will be named as ```filea.sh```.


- ${operator}-script: Corresponding operator will call the script in the yaml file. And the script is wrote by component developers. So the way, how to handle the operator to the component, is designed and programed by component developers.

- deploy-rules: Specify which role(label) of machine will run the service. By setting this filed the service will be scheduled onto the specific node with the configured label.


#### Service schedule policy
The last section mentioned that by setting "deploy-rules" in `service.yaml`, the service will be scheduled onto the specific node with the configured label. This section will introduce the service schedule policy.

To schedule the service onto the specific node, all you only need to do is configuring the `service.yaml` "deploy-rules" field, then PAI will automatically add [NodeAffinity](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) to the service's deployment yaml file when start the service, such as [grafana.yaml.template](https://github.com/Microsoft/pai/blob/master/src/grafana/deploy/grafana.yaml.template) and complete the schedule process. 

"deploy-rules" is an array composed of several component rules. We support multiple rules. A item of rule includes two parts: operator and label. Currently support two kinds of operators: "in" and "notin", the operater decide the service will be deploy on the node "has" or "not has" the label. The label definition of machines is in [cluster-configuration.yaml](https://github.com/Microsoft/pai/blob/master/examples/cluster-configuration/cluster-configuration.yaml#L93). Machines will be labeled automatically when you deploy PAI for the first time. Label config in `service.yaml` should keep the consistent with it in `cluster-configuration.yaml`,  otherwise it will throw an error.

Combine the operators and labels, there are 4 type of deploy-rules:
- "in: pai-master": This rule is for single-instance services, such as webportal, grafana, prometheus, etc. Service will be scheduled onto the node with "pai-master" label. Only one node has the label now.
- "in: pai-worker": This rule is for multi-instance services, such as hadoop-data-node, hadoop-node-manager, etc. Service will be scheduled onto the node with "pai-worker" label. There are multiple nodes have the label now.
- "notin: no-drivers": This rule is only for service drivers, as drivers will be installed on each node, if the system manager want to delete one instance of drivers, he only needs to configure this rule in `service.yaml` of drivers, label the specific machine with label "no-drivers" in [cluster-configuration.yaml machinelist](https://github.com/Microsoft/pai/blob/master/examples/cluster-configuration/cluster-configuration.yaml#L51) and run the command `./paictl.py service refresh -p ${your_clusterconfig_dir} -n drivers`, the instance of drivers on the node with "no-drivers" label will be deleted.
- "notin: no-nodeexporter": This rule is only for service node-exporter. It is the same principle with drivers. 

In the future we will have more labels and support more deployment rules.




## Add a new service

A component developer should:
1) Create a directory named with your component name. And then create ```deploy/``` directory on it.
2) Configure ```service.yaml``` for your component.
3) Design and write ${operator}-script in your source code.





