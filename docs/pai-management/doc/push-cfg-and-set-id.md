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

## Push Configuration to cluster and set cluster id for the new deployed cluster

After the kubernetes cluster is setup, and before managing your cluster and service, you should upload the cluster configuration into the kubernetes cluster with the following command.

### Index

- [Step 1. push cluster configuration and set-id](#push_cfg)
- [Reference](#refer)

### Step 1. Push cluster configuration into k8s configmap and set cluster-id <a name="push_cfg"></a>

- [From local disk](#local_disk)
- [From an external git repo](#git_repo)

#### ```From local disk``` <a name="local_disk"></a>
```bash
python paictl.py config push -p /path/to/config/dir [-c /path/to/kubeconfig]
```
Default value of `-c` is: `~/.kube/config`

#### ```From an external git repo``` <a name="git_repo"></a>

- First please write an external storage configuration.
```YAML
#################
#     Git       #
#################

type: git
url: https://github.com/microsoft/pai.git
branch: branch_name
path: path_in_repo
```

- Then, update this external storage configuration into kubernetes cluster with the following command.

```bash
python paictl.py config external-config-update -e external-config-path [ -c kubeconfig ]
```

Default value of `-c` is: `~/.kube/config`
- At last, execute the update command following

```
python paictl.py config push [-c kubeconfig]
```

Default value of `-c` is: `~/.kube/config`

If this the first time that you upload configuration, a cluster-id will be asked to type. The cluster-id is very ```important```. Please remember it. Every time you wanna manage OpenPAI cluster, the cluster-id is needed.


### Reference <a name="refer"></a>

- [pacitl manual](../../paictl/paictl-manual.md)