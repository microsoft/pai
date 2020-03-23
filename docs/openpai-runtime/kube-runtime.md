# Kube-runtime

## Goal
[kube-runtime](https://github.com/microsoft/openpai-runtime) is a module that provides runtime support for job containers. For more detail, please refer to [openpai-runtime](https://github.com/microsoft/openpai-runtime).

## Build
If you want to build [kube-runtime](https://github.com/microsoft/openpai-runtime) only, under the `build` directory, run the following commands, note to replace `/path/to/cluster-configuration/dir` with your own cluster configuration path.

```sh
python pai_build.py build -c /path/to/cluster-configuration/dir -s kube-runtime

python pai_build.py push -c /path/to/cluster-configuration/dir -i kube-runtime
```

## Deployment

The deployment of kube-runtime goes with the bootstrapping process of the whole PAI cluster, which is described in detail in [Tutorial: Booting up the cluster](../pai-management/doc/distributed-deploy.md).

If you want to redeploy kube-runtime only, you can run following commands, note to replace `/path/to/cluster-configuration/dir` with your own cluster configuration path:

```sh
python paictl.py service start -p /path/to/cluster-configuration/dir -n kube-runtime
```
For more details, please refer to [Maintain your service](../paictl/paictl-manual.md#Service).


## Reference

- [openpai-runtime](https://github.com/microsoft/openpai-runtime)
