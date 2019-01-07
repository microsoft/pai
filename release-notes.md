# Release v0.9.0

## New Features
* Add pai service dashboard to grafana. - [PR 1694](https://github.com/Microsoft/pai/pull/1694)
* Webportal plugin implementation and change pai marketplace to plugin. -[PR 1700](https://github.com/Microsoft/pai/pull/1700)
* Support update virtual cluster dynamically from webportal. -[PR 1831](https://github.com/Microsoft/pai/pull/1831) -[PR 1974](https://github.com/Microsoft/pai/pull/1974)


## Improvements
### Service
* Cluster object model implementation to make it easier for developer to add customized service configuration generation logic. -[PR 1735](https://github.com/Microsoft/pai/pull/1735)
* Job exporter refactor to avoid single external command call will make exporter hang indefinitely. -[PR 1840](https://github.com/Microsoft/pai/pull/1840)
* Make drivers version configurable. - [PR 1626](https://github.com/Microsoft/pai/pull/1626)
* Extend yarn local log expiration time to 7 days. -[PR 1673](https://github.com/Microsoft/pai/pull/1673)
* Add two driver images. Current supports driver's versions are 384.111, 390.25 and 410.73. By default will deploy 390.25 version. -[PR 1642](https://github.com/Microsoft/pai/pull/1642)
* Reduce grafana image from 440M to 280M by merging all startup scripts add removing useless plugin. -[PR 1685](https://github.com/Microsoft/pai/pull/1685)
* Upgrade Nodejs version of webportal and rest server to 8. -[PR 1453](https://github.com/Microsoft/pai/pull/1453)

### Job
* Add timestamp for cloned job's name - [PR 1532](https://github.com/Microsoft/pai/pull/1532)
* Add log if job's image doesn't have ssh server - [PR 1675](https://github.com/Microsoft/pai/pull/1675)

### Command
* Support add machine from node-list file. -[PR 819](https://github.com/Microsoft/pai/pull/819)


## Bug Fixes
* [issue 1603](https://github.com/Microsoft/pai/issues/1603) is fixed by adding job_exporter_iteration_seconds to expose iteration time.  - [PR 1627](https://github.com/Microsoft/pai/pull/1627).
* [issue 1602](https://github.com/Microsoft/pai/issues/1602) is fixed by initializing the host ip from None to unscheduled - [PR 1625](https://github.com/Microsoft/pai/pull/1625).
* [issue 1639](https://github.com/Microsoft/pai/issues/1639) is fixed by adding imagePullSecrets to prometheus. - [PR 1678](https://github.com/Microsoft/pai/pull/1678).
* [issue 1600](https://github.com/Microsoft/pai/issues/1600) is fixed by offloading docker daemon check from watchdog to job-exporter. - [PR 1670](https://github.com/Microsoft/pai/pull/1670).
* Fix admin can't submit job to newly added virtaul cluster. - [PR 1972](https://github.com/Microsoft/pai/pull/1972)


## Upgrading from Earlier Release
* Download the code package of release v0.9.0 from [release page](https://github.com/Microsoft/pai/releases).
Or you can clone the code by running
  ```bash
  git clone --branch v0.9.0 git@github.com:Microsoft/pai.git
  ```
* prepare your cluster configuration by instructions in [OpenPAI Configuration](./docs/pai-management/doc/how-to-write-pai-configuration.md).
  In the *service-configuration.yaml* file, configure the docker info as following:
  ```yaml
  docker-namespace: openpai
  docker-registry-domain: docker.io
  docker-tag: v0.9.0
  ```
* In the code source directory, upgrade by following steps:
  ```bash
  # stop the services
  python paictl.py service stop -p cluster_configuration_file_path
  # after the services are stopped, stop the kubernetes cluster
  python paictl.py cluster k8s-clean -p cluster_configuration_file_path
  # reboot the kubernetes cluster
  python paictl.py cluster k8s-bootup -p cluster_configuration_file_path
  # push cluster configuration file to kubernetes
  python paictl config push -p cluster_configuration_file_path
  # start the services
  python paictl.py service start
  ```