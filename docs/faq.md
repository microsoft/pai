# OpenPAI FAQs

## Table of Contents
1. [User job related FAQs](#user-job-related-faqs)
2. [Deploy and maintenance related FAQs](#deploy-and-maintenance-related-faqs)

## User job related FAQs

### Q: If user find a job to retry multiple times, how to diagnose the cause

A: Users can find historical job logs through yarn. Please check [issue-1072](https://github.com/Microsoft/pai/issues/1072)'s answer and job log doc's section:[Diagnostic job retried many times reason](./user/troubleshooting_job.md#job-is-running-and-retried-many-times) introduction.

### Q: How to diagnose job problems

A: Please check [troubleshooting_job.md](./user/troubleshooting_job.md)'s introduction.

### Q: How to use private docker registry job image when submitting an OpenPAI job

A: Please refer [job_tutorial.md](./job_tutorial.md) to config the auth file at job submit json file:

If you're using a private Docker registry which needs authentication for image pull and is different from the registry used during deployment,
please create an authentication file in the following format, upload it to HDFS and specify the path in `authFile` parameter in config file.

- (1) Create an authFile

authfile content:

```
userprivateimage.azurecr.io
username
password
```

Note: userprivateimage.azurecr.io is docker_registry_server

- (2) [Upload it to HDFS](./hadoop/hdfs.md#WebHDFS).

File path at hdfs example: hdfs://master_ip:9000/user/paidemo/authfile

- (3) Specify the path in `authFile` paramete

OpenPAI job json file example:

```
{
  "jobName": "paidemo",
  "image": "userprivateimage.azurecr.io/demo4pai:test",
  "dataDir": "hdfs://master_ip:9000/user/paidemo/data",
  "outputDir": "hdfs://master_ip:9000/user/paidemo/output",
  "codeDir": "hdfs://master_ip:9000/user/paidemo/code",
  "authFile":"hdfs://master_ip:9000/user/paidemo/authfile",
  "taskRoles": [
    {
      "name": "demo4pai",
      "taskNumber": 1,
      "cpuNumber": 2,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": " cd /home/test && bash train.sh"
    }
  ]
}
```

*NOTE*:
- If you're using a private registry at Docker Hub, you should use `docker.io` for `docker_registry_server` field in the authentication file.
- Related issue: [1125](https://github.com/Microsoft/pai/issues/1215)


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

If probelm remains, you can try [this script](https://gist.github.com/f0k/63a664160d016a491b2cbea15913d549) to self diagnose the problem.


## Deploy and maintenance related FAQs

### Q: Why not recommend deploying the master node to the GPU server and running the job?

A: It is not recommended to run the job on the master node in order to avoid overload on the master node and affect the stability of the cluster.

### Q: When OpenPAI has multiple master nodes, can the master node be deployed on multiple subnets, and they can still access normally?

A: We recommend deploying them on the same subnet. In theory, as long as the network is interoperable, it can be deployed. Considering the high communication requirements of the cluster, the network delay of different subnets is usually high, and the network is often inaccessible.

### Q: To improve the cluster usage, user would like to see a VC can use up all cluster resource if others don’t use it.

A: By default, a VC can use up all cluster resource if others don’t use it. OpenPAI use [capacity scheduler](https://hadoop.apache.org/docs/r1.2.1/capacity_scheduler.html) of YARN for resource allocation. maximum-capacity defines a limit beyond which a queue cannot use the capacity of the cluster. This provides a means to limit how much excess capacity a queue can use. Default value of -1 implies a queue can use complete capacity of the cluster.


### Q: How to configure virtual cluster capacity?

A: By webportal

### Q: What should the admin do when get NodeFilesystemUsage firing?

A: NodeFilesystemUsage firing is caused by disk pressure. The root cause may be HDFS, docker data cache or user data cache. when this firing happens, the admin should do the following steps mitigate the data load. 

- (1) Check HDFS.

Check Hadoop Datanodes (url example: http:// hadoop namenode/dfshealth.html#tab-datanode). 
If only a few nodes are overused, run "hdfs balancer -policy datanode" to rebalance the data among data nodes via HDFS balancer. 
If most nodes are in heavy usage, manually clean some data before do rebalance.

- (2) Check docker cached data.

Run "docker system df" to see how much space can be reclaimed. If the space is large, run command "docker system prune -a" to clean the cache.

- (3) Check /tmp directory. 

Run command "du -h / | awk '$1~/[0-9]*G/{print $0}'" to list all the directory which consumes more than 1G spaces. Clean the data not used any more. 

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
