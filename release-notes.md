# Release v0.8.0

## New Features
* All user submitted jobs can be cloned and resubmitted in Job detail page - [PR 1448](https://github.com/Microsoft/pai/pull/1448).
* The new designed Marketplace and Submit Job V2 are under public review. 
Please refer to the instruction for more information [Marketplace and Submit job v2](./docs/marketplace-and-submit-job-v2/marketplace-and-submit-job-v2.md).
Any feedback and suggestions are appreciated.
* A new service cleaner is added to remove the docker cache and check if there are dangling file handlers hold by live processes on the host.
* Alerting service supports to mute alerts. The instructions can be found via [alert-manager](./docs/alerting/alert-manager.md#muting-firing-alert).
* New Feedback Button: users are allowed to submit GitHub Issues with appended OpenPAI version directly from WebUI - [PR 1289](https://github.com/Microsoft/pai/pull/1289).

## Improvements
### Service
* Memory limits are added for all OpenPAI services. Please refer [Resource Requirement](https://github.com/Microsoft/pai/wiki/Resource-Requirement) for details.
* The [metrics](./docs/alerting/exporter-metrics.md) from alerting service are extended and they can be reported per job, node or service.
* Etcd data path configuration entry is added to [Kubernetes Configuration](./deployment/quick-start/kubernetes-configuration.yaml.template) and user can decide the path to store etcd data permanently - [PR 1221](https://github.com/Microsoft/pai/pull/1221).
* Alert email from Prometheus is refined for clarity - [PR 1282](https://github.com/Microsoft/pai/pull/1282).
* RestServer's [API](./docs/rest-server/API.md) supports username and different users can submit jobs with the same name.

### Job
* When starting container to run user command, --init option is enabled to help avoiding zombie processes. - [PR 1435](https://github.com/Microsoft/pai/pull/1435)
* In the container running user's command, the code directory is mounted as readonly - [PR 1422](https://github.com/Microsoft/pai/pull/1422).
* In job submission request, both user specified and random ports are supported and they can coexist - [PR 1402](https://github.com/Microsoft/pai/pull/1402).
* When Yarn node manager service is deleted, user's job containers will be cleaned forcefully - [PR 1296](https://github.com/Microsoft/pai/pull/1296).

### Web Portal
* The job's view page is enhanced to show the retry history link - [PR 1425](https://github.com/Microsoft/pai/pull/1425).
* On job detail page, job configuration can be exported and stored locally - [PR 1429](https://github.com/Microsoft/pai/pull/1429).

### Command
* Build tool is refactored out from [paictl](./docs/pai-management/README.md) and is implemented by [pai-build](./docs/pai-build/pai-build.md).
* When logging in machines in the cluster on deployment, besides username and password, users can configure the ssh key file path for authentication. The details can be found in [deployment configuration](./docs/pai-management/doc/cluster-bootup.md).

### Example
* Add [auto test](./examples/auto-test/readme.md) to run examples in an automatic or semi-automatic way.

## Bug Fixes
* [issue 1153](https://github.com/Microsoft/pai/issues/1153) is fixed by checking API resources before installing kube-proxy - [PR 1210](https://github.com/Microsoft/pai/pull/1210).
* [issue 1226](https://github.com/Microsoft/pai/issues/1226) is fixed and limit the image pull time in 10 minutes - [PR 1227](https://github.com/Microsoft/pai/pull/1227).
* [issue 1217](https://github.com/Microsoft/pai/issues/1217) is fixed to rotate exporter's log via docker daemon - [PR 1239](https://github.com/Microsoft/pai/pull/1239).
* [issue 1314](https://github.com/Microsoft/pai/issues/1314) is fixed to redirect the WebHDFS requests via pylon correctly - [PR 1328](https://github.com/Microsoft/pai/pull/1328).
* [issue 1396](https://github.com/Microsoft/pai/issues/1396) is fixed to detect GPU correctly when ECC is turned off - [PR 1421](https://github.com/Microsoft/pai/pull/1421).

## Known Issues
* Yarn resource manager abnormality can make the submitted jobs stuck on waiting state. This can be resolved by restarting the Yarn resource manager - [issue 1274](https://github.com/Microsoft/pai/issues/1274).
* Scheduling jobs by GpuType cannot work now since the missing of cluster configuration file in FrameworkLauncher - [Issue 1416](https://github.com/Microsoft/pai/issues/1416).
A work around is to manually update the configuration file to the cluster. This can be done in following steps:
```bash
  # In the OpenPAI source code folder where you do the deployment, 
  # there should be a gpu configuration file under path src/cluster-configuration/deploy/gpu-configuration/gpu-configuration.json.
  # Or you can start cluster-configuration to generate it.
  sudo python paictl.py service start -p your_configuration_dir -n cluster-configuration
  # put the contents to cluster
  curl -X PUT -H "Content-Type: application/json" -H "UserName: root" \
   -d @src/cluster-configuration/deploy/gpu-configuration/gpu-configuration.json "http://master_address:9086/v1/LauncherRequest/ClusterConfiguration"
  # check the configuration
  curl -X GET "http://master_address:9086/v1/LauncherRequest/ClusterConfiguration"
  ```

## Break Changes
* In release v0.8.0 the Yarn container script will be run by docker executor. After a cluster is upgraded to release v0.8.0 from an earlier release.
The jobs submitted before the upgrading cannot be retried on the new release. The retried jobs may end up with nonzero exit code even if they complete correctly.
To run the retried jobs, users need to end them and submit new jobs with the same configuration.

