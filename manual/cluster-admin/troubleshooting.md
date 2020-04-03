# Troubleshooting

1. [Installation Guide](./installation-guide.md)
2. [Installation FAQs and Troubleshooting](./installation-faqs-and-troubleshooting.md)
3. [Basic Management Operations](./basic-management-operations.md)
4. [How to Manage Users and Groups](./how-to-manage-users-and-groups.md)
5. [How to Setup Kubernetes Persistent Volumes as Storage](./how-to-set-up-pv-storage.md)
6. [How to Set Up Virtual Clusters](./how-to-set-up-virtual-clusters.md)
7. [How to Add and Remove Nodes](./how-to-add-and-remove-nodes.md)
8. [How to use CPU Nodes](./how-to-use-cpu-nodes.md)
9. [How to Customize Cluster by Plugins](./how-to-customize-cluster-by-plugins.md)
10. [Troubleshooting](./troubleshooting.md) (this document)
    - [GPU is Not Detected](#gpu-is-not-detected)
    - [A Certain Node is Lost](#a-certain-node-is-lost)
    - [A Certain PAI Service is Not Working](#a-certain-pai-service-is-not-working)
11. [How to Uninstall OpenPAI](./how-to-uninstall-openpai.md)
12. [Upgrade Guide](./upgrade-guide.md)

## GPU is Not Detected

If you cannot use GPU in your job, please check the following items on the corresponding worker node:
 
 1. The GPU driver should be installed correctly. Use `nvidia-smi` to confirm.
 2. The [Nvidia docker runtime](https://github.com/NVIDIA/nvidia-docker) is installed, and configured as the default runtime of docker. Use `docker run --gpus all nvidia/cuda:10.0-base nvidia-smi` to confirm.

If the GPU number shown in webportal is wrong, check the [hivedscheduler and VC configuration](./how-to-set-up-virtual-clusters.md).

## A Certain Node is Lost

If the node is lost temporarily, you can wait until it works normally.

If you want to remove the node from your cluster, refer to [How to Add and Remove Nodes](how-to-add-and-remove-nodes.md).

## A Certain PAI Service is Not Working

You can see service log on the [Kubernetes Dashboard](./basic-management-operations.md#access-kubernetes-dashboard) for triage. After the problem is addressed, restart the service using [paictl.py](./basic-management-operations.md#pai-service-management-and-paictl):

```bash
./paictl.py service stop -n <service-name>
./paictl.py service start -n <service-name>

```