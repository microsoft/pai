# Cluster Autoscaler on AKS Engine

[AKS Engine](https://github.com/Azure/aks-engine) is a tool to help you provision a self-managed Kubernetes cluster on Azure,
while [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler) is another tool that automatically adjusts the size of the Kubernetes cluster.
The Cluster Autoscaler on Azure dynamically scales Kubernetes worker nodes.

This contrib aims to help you deploy a OpenPAI cluster on Azure using AKS Engine, and runs Cluster Autoscaler as a deployment in your cluster.


## Preparations on Azure

1. Install Dependencies

    1. Install [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
    2. Install [AKS Engine](https://github.com/Azure/aks-engine/blob/master/docs/tutorials/quickstart.md#install-the-aks-engine-binary)

2. Create resource group

    There're two options to create resource group in your subscription:
    * It's recommended to use [Azure Portal](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal#create-resource-groups)
    * You can also use [Azure CLI](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-cli#create-resource-groups)

    Remember the following parameters which will be used later:
    * subscription id `${subscriptionId}`
    * resource groupname `${resourcegroup}`
    * location `${location}`

3. Create Service Principal

    Run the following command:

    ```sh
    az ad sp create-for-rbac --skip-assignment --name ${service-principal-name}
    ```

    You will see the following output if it succeed:

    ```json
    {
        "appId": "87432405-56b6-4d76-923b-39d1d75d19f7",
        "displayName": "${service-principal-name}",
        "name": "http://${service-principal-name}",
        "password": "ff5b1601-1298-460d-a94f-fcc8b5ef96f0",
        "tenant": "72e9b8a0-54c8-4742-8da6-1f5d1418c3c5"
    }
    ```

    Remember the following parameters which will be used later:
    * appId `${appId}`
    * password `${password}`
    * displayName `${spName}`
    * tenant `${tenant}`

    For more details on how to create service principal, please refer to [manually-create-a-service-principal document](https://docs.microsoft.com/en-us/azure/aks/kubernetes-service-principal#manually-create-a-service-principal).

4. Add the service principal as the owner of the resource group.


## OpenPAI Deployment

1. Prepare the [configuration file](./config.yaml), replace the variables with parameters in previous steps.
To use Cluster Autosaler, specify the following lines in `openpai_worker_vmss`:

    ```yaml
    openpai_worker_vmss:
      ...
      ca_enable: true
      min_vm_count: 1
      max_vm_count: 10
    ```

2. Deploy Kubernetes cluster with AKS Engine, and deploy OpenPAI:

    ```sh
    python3 azure.py -c config.yaml
    ```
