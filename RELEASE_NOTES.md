# Release v0.10.1 #

## New Features ##

* Admin can configure **MaxCapacity** through REST API for a given Virtual Cluster so that the virtual cluster can use iddle resources as bonus. [#2147](https://github.com/Microsoft/pai/pull/2147)
* Support Azure RDMA. [#2091](https://github.com/Microsoft/pai/pull/2091); [how-to doc](https://github.com/Microsoft/pai/blob/master/docs/pai-management/doc/azure/enable-az-rdma.md) 
* New Disk Cleaner for abnormal disk usage: The disk cleaner will check disk usage every 60 second(configurable), and if the disk usage is above 94%(configurable), it will kill the container that uses largest disk space using specific signal(10), the container will exit with code 1, and the related job will fail. Admin/User can track the reason in job logs. [#2119](https://github.com/Microsoft/pai/pull/2119)
* Web portal: add "My jobs" filter button. [#2111](https://github.com/Microsoft/pai/pull/2111) ![](https://user-images.githubusercontent.com/2500247/52035750-16262000-2566-11e9-8ae7-5e98e25cb5db.png)
* "Submit Simple Job" web portal plugin. [#2131](https://github.com/Microsoft/pai/pull/2131) [Document](https://github.com/Microsoft/pai/blob/pai-0.10.y/contrib/submit-simple-job/README.md)

## Improvements ##

### Service ###

* Hadoop: Improved log readability by disable a not in use HDFS shortcircuit setting. [#2027](https://github.com/Microsoft/pai/pull/2027)
* Extended the job log retention time from 7 days to 30 days. Enabled the log retain time as configurable settings for Admin. [#2034](https://github.com/Microsoft/pai/pull/2034)
* Optimized the RM and Yarn's default configurations for PAI to reduce the resource usage by AM. [#2072](https://github.com/Microsoft/pai/pull/2072)
* Pylon: WebHDFS library compatibility. [#2134](https://github.com/Microsoft/pai/pull/2134)
* Extend the NM expiry time from 15 mins to 60 mins to provide a better tolerable experience for NM downtime. [#2142](https://github.com/Microsoft/pai/pull/2142)
* Alart Manager: Make it more clear in service not up. [#2105](https://github.com/Microsoft/pai/pull/2105)
* Web Portal: Allow jsonc in job submission. [#2084](https://github.com/Microsoft/pai/pull/2084)

### Deployment ###

* Only restart docker deamon, if the configuration is updated. [#2138](https://github.com/Microsoft/pai/pull/2138)

### Documentation ###

* Update document about docker data root's configuration. [#2052](https://github.com/Microsoft/pai/pull/2052)
* Improved how-to-setup-dev-box.md with more details. [#2087](https://github.com/Microsoft/pai/pull/2087)
* Improved hdfs_service.md with more details. [#2096](https://github.com/Microsoft/pai/pull/2096)

### Examples ###

* Add an exmaple of horovod with rdma & intel mpi. [#2112](https://github.com/Microsoft/pai/pull/2112)

### Others ###

* Build: Add error message when image build failed. [#2133](https://github.com/Microsoft/pai/pull/2133)

## Bug Fixes ##

* Issue [#2099](https://github.com/Microsoft/pai/pull/2099) is fixed by
  * Launcher: Revise the definition of Framework running state. [#2135](https://github.com/Microsoft/pai/pull/2135)
  * REST server: Classify two states to WAITING. [#2154](https://github.com/Microsoft/pai/pull/2154)
* Kubernetes: Disable kubernetes's pod eviction. [#2124](https://github.com/Microsoft/pai/pull/2124)
* Grafana: Use yarn's metrics in cluster view. [#2148](https://github.com/Microsoft/pai/pull/2148)
* Add /usr/local/cuda/extras/CUPTI/lib64 to LD_LIBRARY_PATH. [#2043](https://github.com/Microsoft/pai/pull/2043)

## Upgrading from Earlier Release ##

* Download the code package of release v0.10.0 from [release page](https://github.com/Microsoft/pai/releases),
  or you can clone the code by running:

  ```bash
  git clone --branch v0.10.0 git@github.com:Microsoft/pai.git
  ```

* Prepare your cluster configuration by instructions in [OpenPAI Configuration](./docs/pai-management/doc/how-to-write-pai-configuration.md).
  In the *service-configuration.yaml* file, configure the docker info as following:

  ```yaml
  docker-namespace: openpai
  docker-registry-domain: docker.io
  docker-tag: v0.10.0
  ```

* In the code source directory, upgrade by following steps:

  ```bash
  # Stop the services
  python paictl.py service stop -p cluster_configuration_file_path
  # After the services are stopped, stop the kubernetes cluster
  python paictl.py cluster k8s-clean -p cluster_configuration_file_path
  # Reboot the kubernetes cluster
  python paictl.py cluster k8s-bootup -p cluster_configuration_file_path
  # Push cluster configuration file to kubernetes
  python paictl config push -p cluster_configuration_file_path
  # Start the services
  python paictl.py service start
  ```
