# Device Plugin

Kubernetes [device plugin](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/) is used to support host devices in Kuberentes pod.
In OpenPAI, this service will deploy several kinds of device plugins to support deep learning jobs:

- FUSE (`github.com/fuse`)

  `/dev/fuse` device is used to support filesystem in userspace. Fuse device plugin allows user to mount [Azure Blob](https://github.com/Azure/azure-storage-fuse), [HDFS](https://github.com/microsoft/hdfs-mount), etc. in Kubernetes pod.

- NVIDIA GPU (`nvidia.com/gpu`)

  NVIDIA GPU device plugin exposes GPUs `/dev/nvidia*` on host and allows user to use GPU enabled container.
  Offical [NVIDIA GPU device plugin for Kubernetes](https://github.com/NVIDIA/k8s-device-plugin) is ued in PAI.

- RDMA (`rdma/hca`)

  RDMA device plugin supports InfiniBand and RoCE, SRIOV, vHCA, and HCA. It allows user to use InfiniBand in container.
  Offical [Mellanox RDMA SRIOV device plugin](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin) is used in PAI.
