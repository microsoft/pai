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

## Update Configuration

After the kubernetes cluster is setup, and before managing your cluster and service, you should upload the cluster configuration into the kubernetes cluster with the following command.

### Index

- [Push Cluster Configuration](#push_cfg)
- [Reference](#refer)

### Update Cluster Configuration <a name="push_cfg"></a>

- [Option A. From local disk](#local_disk)
- [Option B. From an external git repo](#git_repo)

If your cluster configuration is managed and stored in a host path, you could choose the Option A to update the configuration into the cluster.

If your cluster configuration is managed and stored at a git repo, you could choose the Option B to sync the configuration directly from git repo to cluster.

####     Option A. From local disk

<a name="local_disk"></a>

```bash
python paictl.py config push -p /path/to/config/dir [-c ~/.kube/config]
```

####     Option B. From an external git repo

<a name="git_repo"></a>

- First please write an external storage configuration.

```YAML
#################
#     Git       #
#################

type: git
url: url of git code
branch: branch_name
path: path_in_repo
```

Note: You should do it at the first time to update configuration from git repo to the cluster. If you have done this steps before, you could skip it.

- Then, update this external storage configuration into kubernetes cluster with the following command.

```bash
python paictl.py config external-config-update -e external-config-path [ -c ~/.kube/config ]
```

- At last, execute the update command following

    python paictl.py config push [-c ~/.kube/config]


If this the first time that you upload configuration, a ```cluster-id``` will be asked to type. The cluster-id is used to manage this cluster.

What if you forget the cluster-id? Please refer to the [link](../../paictl/paictl-manual.md#Config_Id) in the pacitl manual book.

### Reference <a name="refer"></a>

- [pacitl manual](../../paictl/paictl-manual.md)