# Release v0.9.0

## New Features
* Add pai service dashboard to grafana, cluster admin can get pai services resource consumption from paiServiceMetrics page. - [PR 1694](https://github.com/Microsoft/pai/pull/1694)
* Support to add custom web pages to the web portal of PAI deployments with WebPortal Plugin, refer to [Plugins Doc](https://github.com/Microsoft/pai/blob/master/docs/webportal/PLUGINS.md) for how to use the new feature, and refer to [PR 1700](https://github.com/Microsoft/pai/pull/1700) for how PAI Marketplace is using it as an example.
* Support update virtual cluster dynamically from webportal. Please refer to [virtual cluster management](https://github.com/Microsoft/pai/tree/master/docs/webportal#virtual-cluster-management) for how to use this new feature. -[PR 1831](https://github.com/Microsoft/pai/pull/1831) [PR 1974](https://github.com/Microsoft/pai/pull/1974)
* Support customized job environment variables. -[PR 1544](https://github.com/Microsoft/pai/pull/1544)
* Add VS Code client for PAI, please refer to [OpenPAI VS Code Client](https://marketplace.visualstudio.com/items?itemName=OpenPAIVSCodeClient.pai-vscode) for more detail.


## Improvements
### Service
* Cluster object model implementation to make it easier for developer to add customized service configuration generation logic. -[PR 1735](https://github.com/Microsoft/pai/pull/1735)
* Job exporter refactor to avoid single external command call will make exporter hang indefinitely. -[PR 1840](https://github.com/Microsoft/pai/pull/1840)
* Extend yarn local log expiration time to 7 days. -[PR 1673](https://github.com/Microsoft/pai/pull/1673)
* Reduce grafana image from 440M to 280M by merging all startup scripts add removing useless plugin. -[PR 1685](https://github.com/Microsoft/pai/pull/1685)
* Upgrade Nodejs version of webportal and rest server to 8. -[PR 1453](https://github.com/Microsoft/pai/pull/1453)
* Support hdfs path customization. -[PR 1922](https://github.com/Microsoft/pai/pull/1922)
* Migrate user information from etcd to k8s secret to reduce the dependency on raw etcd data. -[PR 1917](https://github.com/Microsoft/pai/pull/1917)
* Move user code to a background process. -[PR 1461](https://github.com/Microsoft/pai/pull/1461)
* Support configuration storage all config files will be stored in kubernetes config map. please refer [paictl-manual](https://github.com/Microsoft/pai/blob/master/docs/paictl/paictl-manual.md) to get more information. -[PR 1177](https://github.com/Microsoft/pai/pull/1177) [PR 1431](https://github.com/Microsoft/pai/pull/1431) [PR 1489](https://github.com/Microsoft/pai/pull/1489)

### Job
* Add timestamp for cloned job's name - [PR 1532](https://github.com/Microsoft/pai/pull/1532)
* Add log if job's image doesn't have ssh server - [PR 1675](https://github.com/Microsoft/pai/pull/1675)
* Escape injected variables in shell scripts -[PR 1860](https://github.com/Microsoft/pai/pull/1860)
* Add an example of how to integrate jupyter and pai by using restserver. -[PR 1676](https://github.com/Microsoft/pai/pull/1676)
* Expose all ports among tasks and the format will be:PAI_${taskRole}_${taskidx} _${portLabel}_PORT=${portNumber}. -[PR 1918](https://github.com/Microsoft/pai/pull/1918)

### GPU driver
* Make GPU drivers version configurable. - [PR 1626](https://github.com/Microsoft/pai/pull/1626)
* Add two driver images. Current supports driver's versions are 384.111, 390.25 and 410.73. By default will deploy 390.25 version. -[PR 1642](https://github.com/Microsoft/pai/pull/1642)
* User can skip driver installation if they pre-installed. -[PR 1841](https://github.com/Microsoft/pai/pull/1841)

### Command
* Support add machine from node-list file. -[PR 819](https://github.com/Microsoft/pai/pull/819)
* Add config sub-command in paictl to manage config files. -[PR 1263](https://github.com/Microsoft/pai/pull/1263)
* After the configuration storage is enabled -p is no longer required in the service sub-command.

### Example
* Use tensorflow job instead of cntk job as end-to-end tests. **Note**: If the user is upgrading from the previous version of pai, please delete the test data file under the hdfs://ip:port/Test folder to ensure that the end-to-end-test works normally.


## Bug Fixes
* [issue 1603](https://github.com/Microsoft/pai/issues/1603) is fixed by adding job_exporter_iteration_seconds to expose iteration time.  - [PR 1627](https://github.com/Microsoft/pai/pull/1627).
* [issue 1602](https://github.com/Microsoft/pai/issues/1602) is fixed by initializing the host ip from None to unscheduled - [PR 1625](https://github.com/Microsoft/pai/pull/1625).
* [issue 1639](https://github.com/Microsoft/pai/issues/1639) is fixed by adding imagePullSecrets to prometheus. - [PR 1678](https://github.com/Microsoft/pai/pull/1678).
* [issue 1600](https://github.com/Microsoft/pai/issues/1600) is fixed by offloading docker daemon check from watchdog to job-exporter. - [PR 1670](https://github.com/Microsoft/pai/pull/1670).
* Fix admin can't submit job to newly added virtaul cluster. - [PR 1972](https://github.com/Microsoft/pai/pull/1972)
* [issue 2005](https://github.com/Microsoft/pai/issues/2005) is fixed by making Grafana Legend unique in task level dashboard. - [PR 1921](https://github.com/Microsoft/pai/pull/1921)

## Known Issues
* Paictl may fail to start service after calling stop service. [issue 2081](https://github.com/Microsoft/pai/issues/2081)
* If a running container's "View SSH Info" popup is opened in Chrome browser. By clicking the "private key" link the private key file will downloaded and stored to local host. The key file's name consists of the user name and job name, jointed by a ~ character. Chrome will replace the ~ with - character. So users need to change the key file name accordingly when SSH to the container by following step 3 and 4 in the "View SSH Info" popup. Please follow [issue 1574](https://github.com/Microsoft/pai/issues/1574) to track this problem.

## Upgrading from Earlier Release
* Download the code package of release v0.9.0 from [release page](https://github.com/Microsoft/pai/releases).
Or you can clone the code by running
  ```bash
  git clone --branch v0.9.0 git@github.com:Microsoft/pai.git
  ```
* prepare your cluster configuration by instructions in [OpenPAI Configuration](./examples/cluster-configuration/services-configuration.yaml). Configure the docker info as following:
  ```yaml
  docker-registry:
    namespace: openpai
    domain: docker.io
    tag: v0.9.0
  ```
* In the code source directory, upgrade by following steps:
  ```bash
  # push cluster configuration file to kubernetes
  python paictl config push -p cluster_configuration_file_path
  # stop the services
  python paictl.py service stop
  # after the services are stopped, stop the kubernetes cluster
  python paictl.py cluster k8s-clean -p cluster_configuration_file_path
  # reboot the kubernetes cluster
  python paictl.py cluster k8s-bootup -p cluster_configuration_file_path
  # start the services
  python paictl.py service start
  ```

## Thanks to our Contributors

Thanks to the following people who have contributed new code or given us helpful suggestions for this release:

Bin Wang, Fan Yang, Can Wang, Di Xu, Hao Yuan, Qixiang Cheng, Xinwei Zheng @USTC (virtual cluster update), Yanjie Gao, Yundong Ye, Ziming Miao, Yuqi Wang, Scarlett Li, Dian Wang, Mao Yang, Shuguang Liu, Quanlu Zhang