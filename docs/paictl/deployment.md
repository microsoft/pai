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
```


- prerequisite: Some services have external dependency. For example, in openpai, restserver will have to wait frameworklaucnher ready. Developers could define dependency rule for their component. And service deployment module will start the target service first.


- template-list: The file in the template-list should be contained in the path ```${component}/deploy/```. And if ```filea.sh``` is in the list, you should named the template file as the name ```filea.sh.template```. After generating, the new file will be named as ```filea.sh```.


- ${operator}-script: Corresponding operator will call the script in the yaml file. And the script is wrote by component developers. So the way, how to handle the operator to the component, is designed and programed by component developers.



## Add a new service

A component developer should:
1) Create a directory named with your component name. And then create ```deploy/``` directory on it.
2) Configure ```service.yaml``` for your component.
3) Design and write ${operator}-script in your source code.





