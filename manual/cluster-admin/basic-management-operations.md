# Basic Management Operations

## Management on Webportal

If you log in to the webportal as an administrator, you will find several buttons about administration on the left sidebar, as shown in the following image.

   <img src="/manual/cluster-admin/imgs/administration.png" width="100%" height="100%" /> 

Most of these functions are easy to understand. We will go through them quickly in this section.

### Hardware Utilization Page

The hardware page shows the CPU, GPU, memory, disk, network utilization of each node in your cluster. The utilization is shown in different color basically. If you hover your mouse on these colored circles, exact utilization percentage will be shown.

   <img src="/manual/cluster-admin/imgs/hardware.png" width="100%" height="100%" />

### Services Page

The services page shows OpenPAI services deployed in Kubernetes. These services are daemonset, deployment, or just pods.

   <img src="/manual/cluster-admin/imgs/services.png" width="100%" height="100%" />


### User Management

The user management page let you create, modify, and delete users. Users have two types: non-admin users and admin users. You can choose which type to create. This page only shows up when OpenPAI is deployed in basic authentication mode, which is the default mode. If your cluster uses AAD to manage users, this page won't be available to you.

   <img src="/manual/cluster-admin/imgs/services.png" width="100%" height="100%" />


### Abnormal Jobs

On the homepage, there is an `abnormal jobs` section for administrators. A job is treated as an abnormal job if it runs more than 5 days or GPU usage is lower than 10%. You can choose to stop some abnormal jobs if you desire so.

   <img src="/manual/cluster-admin/imgs/abnormal-jobs.png" width="100%" height="100%" />

### Access Kubernetes Dashboard

There is a shortcut to k8s dashboard on the webportal. However, it needs special authentication for security issues.

   <img src="/manual/cluster-admin/imgs/abnormal-jobs.png" width="100%" height="100%" />

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

## PAI service management and paictl

### What is PAI Service?

### Use Paictl to Customize Config, and Restart PAI Services

