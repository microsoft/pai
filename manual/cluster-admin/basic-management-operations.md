# Basic Management Operations

1. [Installation Guide](./installation-guide.md)
2. [Installation FAQs and Troubleshooting](./installation-faqs-and-troubleshooting.md)
3. [Basic Management Operations](./basic-management-operations.md) (this document)
    - [Management on Webportal](#management-on-webportal)
    - [PAI Service Management and Paictl](#pai-service-management-and-paictl)
4. [How to Manage Users and Groups](./how-to-manage-users-and-groups.md)
5. [How to Setup Kubernetes Persistent Volumes as Storage](./how-to-set-up-pv-storage.md)
6. [How to Set Up Virtual Clusters](./how-to-set-up-virtual-clusters.md)
7. [How to Add and Remove Nodes](./how-to-add-and-remove-nodes.md)
8. [How to use CPU Nodes](./how-to-use-cpu-nodes.md)
9. [How to Customize Cluster by Plugins](./how-to-customize-cluster-by-plugins.md)
10. [Troubleshooting](./troubleshooting.md)
11. [How to Uninstall OpenPAI](./how-to-uninstall-openpai.md)
12. [Upgrade Guide](./upgrade-guide.md)

## Management on Webportal

The webportal provides some basic administration functions. If you log in to it as an administrator, you will find several buttons about administration on the left sidebar, as shown in the following image.

   <img src="./imgs/administration.png" width="100%" height="100%" /> 

Most of these functions are easy to understand. We will go through them quickly in this section.

### Hardware Utilization Page

The hardware page shows the CPU, GPU, memory, disk, network utilization of each node in your cluster. The utilization is shown in different color basically. If you hover your mouse on these colored circles, exact utilization percentage will be shown.

   <img src="./imgs/hardware.png" width="100%" height="100%" />

### Services Page

The services page shows OpenPAI services deployed in Kubernetes. These services are daemonset, deployment, or stateful sets.

   <img src="./imgs/services.png" width="100%" height="100%" />


### User Management

The user management page let you create, modify, and delete users. Users have two types: non-admin users and admin users. You can choose which type to create. This page only shows up when OpenPAI is deployed in basic authentication mode, which is the default mode. If your cluster uses [AAD](./how-to-manage-users-and-groups.md#users-and-groups-in-aad-mode) to manage users, this page won't be available to you.

   <img src="./imgs/services.png" width="100%" height="100%" />


### Abnormal Jobs

On the homepage, there is an `abnormal jobs` section for administrators. A job is treated as an abnormal job if it runs more than 5 days or GPU usage is lower than 10%. You can choose to stop some abnormal jobs if you desire so.

   <img src="./imgs/abnormal-jobs.png" width="100%" height="100%" />

### Access Kubernetes Dashboard

There is a shortcut to k8s dashboard on the webportal. However, it needs special authentication for security issues.

   <img src="./imgs/k8s-dashboard.png" width="100%" height="100%" />

To access it, we need to do following steps on the dev box machine.

1. Save following yaml text as `admin-user.yaml`
    ```yaml
    apiVersion: v1
    kind: ServiceAccount
    metadata:
      name: admin-user
      namespace: kube-system
    ---
    apiVersion: rbac.authorization.k8s.io/v1
    kind: ClusterRoleBinding
    metadata:
      name: admin-user
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: ClusterRole
      name: cluster-admin
    subjects:
    - kind: ServiceAccount
      name: admin-user
      namespace: kube-system
    ```
2. Run `kubectl apply -f admin-user.yaml`
3. Run `kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')`. It will print the token which can be used to login k8s-dashboard.

## PAI Service Management and Paictl

Generally speaking, PAI services are daemon sets, deployments or stateful sets created by PAI system, running on Kubernetes. You can find them on the [k8s dashboard](#access-kubernetes-dashboard) and [services page](#services-page). For example, `webportal` is a PAI service which provides front-end interface, and `rest-server` is another one for back-end APIs.

All PAI services are configurable. If you have followed the [installation-guide](./installation-guide.md), you can find two files, `layout.yaml` and `services-configuration.yaml`, in folder `~/pai-deploy/cluster-cfg` on the dev box machine. These two files are the default service configuration.

If the configuration is lost, retrieve them back by:

```bash
git clone https://github.com/microsoft/pai.git
cd pai
./paictl.py config pull -o ~/test
``` 

The command will ask you for the cluster id for confirmation. If you forget it, another command `./paictl.py config get-id` will help you.

The `layout.yaml` and `services-configuration.yaml` will be written to `~/test` after `./paictl.py config pull -o ~/test`.

You might have noticed the `./paictl.py` script. Actually it is a CLI tool to help manage your PAI services. Here are some usage examples of `paictl`:

```bash
# get cluster id
./paictl.py config get-id

# pull service config to a certain folder
./paictl.py config pull -o <config-folder>

# push service config to the cluster
./paictl.py config push -p <config-folder> -m service

# stop all PAI services
./paictl.py service stop

# start all PAI services
./paictl.py service start

# stop several PAI services
./paictl.py service stop -n <service-name-1> <service-name-2>

# start several PAI services
./paictl.py service start -n <service-name-1> <service-name-2>
```

If you want to change configuration of some services, please follow the steps of `service stop`, `config push` and `service start`.

For example, you can find the following section in your default `services-configuration.yaml`:

```yaml
webportal:
  plugins:
  - id: submit-job-v2
    title: Submit Job v2
    uri: https://gerhut.github.io/store/submit-job-v2/plugin.js
  - id: marketplace
    title: Marketplace
    uri: https://gerhut.github.io/store/marketplace/plugin.js
  server-port: 9286
```

It is the configuration of webportal. Now let's change the title of one plugin: modify `title: Marketplace` to `title: MyMarketplace`, and save the file.

Use the following command to push the configuration and restart webportal:

```bash
./paictl.py service stop -n webportal
./paictl.py config push -p <config-folder> -m service
./paictl.py service start -n webportal
```

Then you will find the plugin title is changed:

   <img src="./imgs/change-title.png" width="100%" height="100%" />
