# Access K8S Dashboard

This doc is for ops/admin users. If ops/admin deployed OpenPAI with k8s RBAC enabled. The k8s dashboard with `https` enabled  will be deployed. And authentication is needed to access k8s-dashboard.

Currently, we only support accessing k8s dashboard through service token.

## Prerequisite
1. Have the valid kube-config and can use kubectl to access k8s cluster. For setup kubectl, please refer to [setup kubectl](https://github.com/microsoft/pai/blob/master/contrib/kubespray/doc/step-by-step-k8s.md#setup-kubectl).
2. OpenPAI cluster enables HTTPS. Otherwise you need to access dashboard through kube-proxy (refer to [access dashboard](https://github.com/kubernetes/dashboard/blob/master/docs/user/accessing-dashboard/1.7.x-and-above.md)).

## Access K8S Dashboard with service token
To access k8s dashboard, we need to do following steps.
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
3. Run `kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')`. It will print the token which can be used to login k8s-dashboard

For further information, please visit [Creating sample user](https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md).