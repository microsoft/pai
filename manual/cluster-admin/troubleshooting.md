# Troubleshooting

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