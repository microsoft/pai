# OpenPAI FAQs

## Table of Contents
1. [User job related FAQs](#user-job-related-faqs)
2. [Deploy and maintenance related FAQs](#deploy-and-maintenance-related-faqs)

## User job related FAQs

### Q: If user find a job to retry multiple times, how to diagnose the cause

A: Users can find historical job logs through yarn. Please check [issue-1072](https://github.com/Microsoft/pai/issues/1072)'s answer and job log doc's section:[Diagnostic job retried many times reason](./user/troubleshooting_job.md#job-is-running-and-retried-many-times) introduction.

### Q: How to diagnose job problems

A: Please check [troubleshooting_job.md](./user/troubleshooting_job.md)'s introduction.

### Q: How many jobs does PAI support?

A: According to the default configuration, PAI supports 60k jobs, including waiting/running/finished jobs.

The limitation is because we only reserve so much memory resource for `PAI services`, it may be enough in typical scenario.

For example, user may have hundreds jobs running, thousands jobs waiting, and tens of thousands jobs finished.


### Q: How to solve `failed call to cuInit: CUresult(-1)`

You should check `LD_LIBRARY_PATH` in your job container by using `export` command. It should have one of following:

* `/usr/local/nvidia/lib`
* `/usr/local/nvidia/lib64`
* `/usr/local/cuda/extras/CUPTI/lib`
* `/usr/local/cuda/extras/CUPTI/lib64`

You can add path to `LD_LIBRARY_PATH` in your Dockerfile like:
```
ENV LD_LIBRARY_PATH=/usr/local/nvidia/lib:/usr/local/nvidia/lib64:/usr/local/cuda/extras/CUPTI/lib:/usr/local/cuda/extras/CUPTI/lib64:$LD_LIBRARY_PATH
```

If problem remains, you can try [this script](https://gist.github.com/f0k/63a664160d016a491b2cbea15913d549) to self diagnose the problem.


## Deploy and maintenance related FAQs

### Q: Why not recommend deploying the master node to the GPU server and running the job?

A: It is not recommended to run the job on the master node in order to avoid overload on the master node and affect the stability of the cluster.

### Q: When OpenPAI has multiple master nodes, can the master node be deployed on multiple subnets, and they can still access normally?

A: We recommend deploying them on the same subnet. In theory, as long as the network is interoperable, it can be deployed. Considering the high communication requirements of the cluster, the network delay of different subnets is usually high, and the network is often inaccessible.

### Q: How to change Docker cache path for OpenPAI?

A: If default Docker cache path is set to a disk with small disk space, the path can be changed with below steps:

1.	Stop ALL service of the cluster.
  ```sudo ./paictl.py service stop```
2.	Uninstall k8s cluster. This operation will not delete your data.
  ```sudo ./paictl.py cluster k8s-clean –p /path/to/config```
3.	Change the Docker cache path on OpenPAI node using data-root flag. Please refer to [Docker docs](https://docs.docker.com/config/daemon/systemd/)
4.  Modify your config file layout.yaml. Change "docker-data" to new Docker cache path configured in step 3. See sample [layout.yaml](../examples/cluster-configuration/layout.yaml#L55)
5.	Restart k8s cluster with updated config.
  ```sudo ./paictl.py cluster k8s-bootup –p /path/to/new/config```
6.	Push the latest config to cluster.
  ```sudo ./paictl.py config push –p /path/to/new/config```
7.	Restart all service.
  ```sudo ./paictl.py service start```

Note:
1. The cluster is unavailable during this change, it may take long time due to pull all images again.
2. The legacy docker cache path won’t be automatically cleaned. Manually clean up is needed.
