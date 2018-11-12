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
    # 1. config vm ssh. Note: ssh kex algo is pending issue.
    for i in `az vm list-ip-addresses --resource-group $nodeResourceGroup -o table`;
    do
    if [[ $i =~ aks-agentpool* ]]; then
       az vm user update -u "$vmUsername" -p "$vmPassword" -n $i -g $nodeResourceGroup 
       echo "change password for node $i" 
    fi
    done
    # 2. config k8s dashboard
    kubectl create clusterrolebinding kubernetes-dashboard --clusterrole=cluster-admin --serviceaccount=kube-system:kubernetes-dashboard
    # 3. give auth for api-server 
    
else
echo "enter not in AKS config"
    for i in `az vm list-ip-addresses --resource-group $nodeResourceGroup -o table`;
    do
    if [[ $i =~ aks-agentpool* ]]; then
       kubectl label nodes $i dev-box=true
       kubectl apply -f dev-box-k8s-deploy.yaml
       echo "label and deploy dev-box for node $i"
       break;
    fi
    done
fi
