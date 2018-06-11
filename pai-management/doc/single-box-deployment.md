## Single Box Deployment

PAI can be deployed in single box environment after making some changes to cluster configuration files.
You can find the details of those configuration files in [A Guide For Cluster Configuration](how-to-write-pai-configuration.md).

To deploy PAI in single box environment, you need to set `pai-master` and `pai-worker` labels for the same machine in `machine-list` section of `cluster-configuration.yaml` file.

```yaml
machine-list:

    - hostname: hostname (echo `hostname`)
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid1
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: master
      dashboard: "true"
      zkid: "1"
      pai-master: "true"
      pai-worker: "true"
```
