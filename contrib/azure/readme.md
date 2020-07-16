#### Install Necessary Package.

- [ Install Azure CLI ](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
- [ Install AKS-Engine ](https://github.com/Azure/aks-engine/blob/master/docs/tutorials/quickstart.md#install-the-aks-engine-binary)

#### Create Resource Group

- Solution A [ Azure Portal ](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal#create-resource-groups) (Recommended)
- Solution B [ Azure CLI ](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-cli#create-resource-groups)

Remember the following parameters

- subscription id: ```${subscriptionId}```
- resource groupname: ```${resourcegroup}```
- location: ```${location}```

#### Create Service Principle

```bash
az ad sp create-for-rbac --skip-assignment --name ${service-principal-name}
```

If the command success, the output will like the following example.

```json
{
  "appId": "559513bd-0c19-4c1a-87cd-851a26afd5fc",
  "displayName": "${service-principal-name}",
  "name": "http://${service-principal-name}",
  "password": "e763725a-5eee-40e8-a466-dc88d980f415",
  "tenant": "72f988bf-86f1-41af-91ab-2d7cd011db48"
}
```
Remember the following parameters.

- ```appId```: ```${appId}```
- ```password```: ```${password}```
- ```displayName```: ```${spName}```
- ```tenant```: ```${tenant}```
  
  
[The doc about this steps](https://docs.microsoft.com/en-us/azure/aks/kubernetes-service-principal#manually-create-a-service-principal)

#### Ask your subscription's admin to add the new service principal as the owner of the new resource group.

Content as the title. Important and don't forget it.

#### Write Configuration

[Configuration example](config.yml)

#### Start Cluster

```
python3 azure.py -c config.yml
```
