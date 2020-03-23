# Openpai-runtime

## Goal
[openpai-runtime](https://github.com/microsoft/openpai-runtime) is a module that provides runtime support for job containers. For more detail, please refer to [openpai-runtime](https://github.com/microsoft/openpai-runtime).

## Deployment

The deployment of openpai-runtime goes with the bootstrapping process of the whole PAI cluster, which is described in detail in [Tutorial: Booting up the cluster](../pai-management/doc/distributed-deploy.md).

If you want to redeploy openpai-runtime only, you can run following commands, note to replace `/path/to/cluster-configuration/dir` with your own cluster configuration path:

```sh
python paictl.py service start -p /path/to/cluster-configuration/dir -n openpai-runtime
```
For more details, please refer to [Maintain your service](../paictl/paictl-manual.md#Service).


## Reference

- [openpai-runtime](https://github.com/microsoft/openpai-runtime)
