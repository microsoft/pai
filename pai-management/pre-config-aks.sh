subscriptionName=""
resourceGroup=""
name=""
nodeResourceGroup=""
vmUsername=""
vmPassword=""
inAKS=false

az login
az account set --subscription "$subscriptionName"
az aks get-credentials --resource-group "$resourceGroup" --name "$name"
az vm list-ip-addresses --resource-group "$nodeResourceGroup" -o table
if $inAKS; then
echo "enter in AKS config"
    for i in `az vm list-ip-addresses --resource-group $nodeResourceGroup -o table`;
    do
    if [[ $i =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
       az vm user update -u "$vmUsername" -p "$vmPassword" -n $i -g $resourceGroup --name $name
       echo "change password for node $i" 
    fi
    done
else
echo "enter not in AKS config"
    for i in `az vm list-ip-addresses --resource-group $nodeResourceGroup -o table`;
    do
    if [[ $i =~ aks-agentpool* ]]; then
       echo "label and deploy dev-box for node $i"
       kubectl label nodes $i dev-box=true
       kubectl apply -f dev-box-k8s-deploy.yaml
       break;
    fi
    done
fi
