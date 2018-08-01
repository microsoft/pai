
#### What will pai do on your host when deploying or adding new k8s nodes?

- If there is no docker on the target host, pai will install the latest docker-ce.
    - [The Script Link](../k8sPaiLibrary/maintaintool/docker-ce-install.sh)
- Change the host file in the path ```/etc/hosts```
    - [The Script Link](../k8sPaiLibrary/maintaintool/hosts-check.sh)
    - Because hadoop service will be deployed on hostnetworking environment. And some configuration of hosts file will have a bad influence on hadoop’s name resolve behavior.
- Prepare kubelet environment and start kubelet through docker
    - Prepare kubelet environment accoding to node role
    - [The Python Module To Deploy PAI](../k8sPaiLibrary/maintainlib/deploy.py)
    - [The Environment Preparation Script Link](../k8sPaiLibrary/maintaintool/kubelet-start.sh)
    - [The Starting Script Link](../k8sPaiLibrary/template/kubelet.sh.template)

#### Kubernetes Disk Pressure Status

- Why does this issue happen on your cluster?
    - Because the usage of the disk has reach the limit which we set through kubelet.
    - To change the threshold according to your environment. You should change the field the line ```--eviction-hard="memory.available<5%,nodefs.available<5%,imagefs.available<5%,nodefs.inodesFree<5%,imagefs.inodesFree<5%"``` in [the kubelet.sh.template](../k8sPaiLibrary/template/kubelet.sh.template)


- Some useful references:
    - [Configuring kubelet Garbage Collection](https://kubernetes.io/docs/concepts/cluster-administration/kubelet-garbage-collection/)
    - [Configure Out Of Resource Handling](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/)


#### Unable to start kubelet

1) Please ensure whether you could access to ```gcr.io``` or not. If you couldn't access to ```gcr.io```, you will failed to pull kubernetes image.
    - In the [kubernetes-configuration.yaml](../../cluster-configuration/kubernetes-configuration.yaml), you could find a field ```docker-registry```. This field is set the docker registry used in the k8s deployment. To use the official k8s Docker images, set this field to ```gcr.io/google_containers```, the deployment process will pull Kubernetes component's image from ```gcr.io/google_containers/hyperkube```. But if you can't access to it, you can also set the docker registry to ```docker.io/openpai```, which is maintained by pai.

2) [ Known Issue 813](https://github.com/Microsoft/pai/issues/813)

