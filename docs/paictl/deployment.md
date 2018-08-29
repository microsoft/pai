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

A component




