<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

# AII On Kubernetes

## Prerequisite

The python and docker need to be installed.

Python(2.x) and the lib to install:
```
sudo apt-get install python python-yaml python-jinja2 
```

[Docker install](https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/)

## Cluster configuration and generate script

An example of the cluster configuration. When deploy aii to your cluster, pls replace all the IP and host detail with your own host configuration.
```yaml
clusterID: your_cluster_id


clusterinfo:

  # static docker-version
  # https://download.docker.com/linux/static/stable/x86_64/docker-17.06.2-ce.tgz
  dockerverison: 17.06.2

  # docker registry infomation
  dockerregistryinfo:

    # If public, pls fill it same as your username
    docker_namespace: your_registry_namespace

    # If public，Fill docker_registry_domain with word "public"
    # docker_registry_domain: public
    docker_registry_domain: your_registry_domain
    docker_username: your_registry_username
    docker_password: your_registry_password

    # The name of the secret in kubernetes will be created in your cluster
    secretname: your_secret_name

  # intra docker registry infomation
  intraregistryinfo:

    # docker image tag version for intra docker registry
    registry_image_tag: 2
    registry_proxy_image_tag: 0.4

    # ip and port for docker registry server
    server_ip: 10.0.3.9
    server_port: 5000

  # The config of hadoop which will be used by kubernetes.
  hadoopinfo:
    # If custom_hadoop_binary_path is None, script will download a common hadoop binary for you.
    # hadoop-version
    # http://archive.apache.org/dist/hadoop/common/hadoop-2.7.2/hadoop-2.7.2.tar.gz
    custom_hadoop_binary_path: None
    hadoopversion: 2.7.2
    configmapname: hadoop-configuration
    # For future HA. Now this ip address is same as the master IP of the infra node.
    hadoop_vip: 10.0.3.9

  frameworklauncher:
    # For future HA and LB.
    frameworklauncher_vip: 10.0.3.9
    frameworklauncher_port: 9086

  restserverinfo:
    # path for rest api server src dir
    src_path: ../rest-server/
    # uri for frameworklauncher webservice
    webservice_uri: http://10.0.3.9:9086
    # uri for hdfs
    hdfs_uri: hdfs://10.0.3.9:9000
    # port for rest api server
    server_port: 9186

  # The config of webportal
  webportalinfo:
    # The address of the rest server to connect to
    rest_server_addr: http://10.0.3.9:9186
    # The address of the kubernetes dashboard to 
    k8s_dashboard_addr: 10.0.3.12
    # The port of webportal server
    port: 6969


# The detail of the machine in your cluster.
# An example
machineinfo:

  NC24R:
    mem: 224
    gpu:
    # type: gpu{type}
      type: teslak80
      count: 4
    cpu:
      vcore: 24
    dataFolder: "/mnt"
    # Note: Up to now, the only supported os version is Ubuntu16.04. Pls don't change it here.
    os: ubuntu16.04

  D8SV3:
    mem: 32
    cpu:
      vcore: 8
    dataFolder: "/mnt"
    # Note: Up to now, the only supported os version is Ubuntu16.04. Pls don't change it here.
    os: ubuntu16.04


# The machine list of your cluster
# An example
machinelist:
  # Replace your own hostname here.
  infra-03:
    # Replace your own IP here.
    nodename: 10.0.3.9
    # Replace your own machine type here
    machinetype: D8SV3
    # Replace your own IP here.
    ip: 10.0.3.9
    registryrole: server
    hadooprole: master
    launcher: "true"
    restserver: "true"
    webportal: "true"
  
  # Do the same work as the machine above.
  worker-01:
    nodename: 10.0.3.11
    machinetype: NC24R
    ip: 10.0.3.11
    registryrole: client
    hadooprole: worker
  
  # Do the same work as the machine above.
  worker-02:
    nodename: 10.0.3.12
    machinetype: NC24R
    ip: 10.0.3.12
    registryrole: client
    hadooprole: worker

```

## Prepare hadoop configuration (patching)

```
./prepare_hadoop_config.sh
```

## Build docker image

```
sudo ./docker_build.py -p your-cluster-config.yaml
```


## Deploy Service on kubernetes

Before running the deploy script, you should prepare all your hadoop configuration in the hadoop-configuration folder.
It's clear that this script consist of two parts. One will generate the hadoop configuration for the service of hadoop, and another will start up corresponding service.

The environment `${GENERATE_CONFIG}` and `${START_SERVICE}` will be defined in the yaml file.

Because kuberentes's configmap can be mounted as a directory. The file name will be the key, and the file content will be the value. So we can easily upload all the configuration to the hadoop service pod. And then according to the different generate script, a pod will copy corresponding configuration file to the etc/hadoop fold of hadoop.

So please put all your configuration file, service generate script and startup script to the folder which you set in the cluster configuration.


And then execute the command following.
```
sudo ./deploy.py -p your-cluster-config.yaml
```

If you want to clean your generated file pls add parameter -c.

Note: currently, pls run the start script by hand. We note use the function of auto-startup yet.


## How to add or remove service to the cluster?

If your service will use custom image. Pls create a fold with the name same as your service. And put all your file of the docker image in the folder. Then put it in the path src/
Then write the detail of the image in the service.yaml.

Then write your service detail in the servicelist of service.yaml 


#### The foler structure
```
service-deployment 
|
+-----bootstrap
|       |
|       +------ folder with service name    (the name in the service.yaml)
|
+-----src
|       |
|       +------folder with customized image name    (the name in the service.yaml)
|
+------deploy.py   (The script to bootstrap service in the cluster)
|
+------docker_build.py (The script to build all the customized docker image and push them to the docker registry)
|
+------clusterconfig-example.yaml  (the config of the cluster)
|
+------service.yaml ( the list and information of the  service in the cluster. The list of customized docker image)
|
+------readmd.md
```

#### Service.yaml
```yaml
imagelist:
  # If your service have custom image, pls set the detail here.
  # The image name should be same as the folder in src.
  # pls set your template file name in the templatelist. If there is no template in this image, fill None.
  # If the docker image have prerequisite custom image, pls fill it in  prerequisite. If no, fill None.
  base-image:
    templatelist:
      - None
    prerequisite: None

  drivers:
    templatelist:
      - None
    prerequisite: None

  hadoop-run:
    templatelist:
      # dockerfile.template
      - dockerfile
    prerequisite: base-image

  zookeeper:
    templatelist:
      - dockerfile
    prerequisite: base-image

  frameworklauncher:
    # the copy will be placed in the path src/framworklauncher/copied_file
    copy:
      - ../frameworklauncher
    templatelist:
      - dockerfile
    prerequisite: hadoop-run


# Before starting your service, ensure the kubectl has been installed on your host.
# If you want to remove a certain service, comment it in the servicelist.
servicelist:
  cluster-configuration:
    prerequisite:
      - None
    templatelist:
      - secret.yaml
    startscript: start.sh

  containerregistry:
    prerequisite:
      - None
    templatelist:
      - node-label.sh
      - kube-registry-ds.yaml
      - kube-registry-proxy-ds.yaml
    startscript: start.sh

  drivers:
    prerequisite:
      - cluster-configuration
    templatelist:
      - node-label.sh
      - drivers.yaml
    # Note： your script should start all your service dependency. And should be check whether you service start or not.
    startscript: start.sh

  hadoop-service:
    prerequisite:
      - cluster-configuration
      - drivers
    templatelist:
      - node-label.sh
      - configmap-create.sh
      - hadoop-name-node.yaml
      - hadoop-data-node.yaml
      - hadoop-resource-manager.yaml
      - hadoop-node-manager.yaml
      - hadoop-jobhistory.yaml
      - zookeeper.yaml
    startscript: start.sh

  frameworklauncher:
    prerequisite:
      - cluster-configuration
      - hadoop-service
    templatelist:
      - frameworklauncher.yaml
      - node-label.sh
    startscript: start.sh
```

If you want to add your own service, it is easy to follow this way. After you finish set the information of your service in the service.yaml and put your file in the corresponding path. When running deploy.py, your service will startup.

If you want to remove some default services, just comment them in service.yaml before running deploy.py.

#### Template

All the template will be completed by jinja2. This is a template lib. Pls refer to this address: http://jinja.pocoo.org/
And all the information will be got from clusterconfig.
If your service need more information, pls add your property to cluster config. Note the new property should be in clusterinfo,  machineinfo or machinelist.
