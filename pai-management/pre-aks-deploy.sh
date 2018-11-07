SUBSCRIPTION=""
RESOURCE_GROUP=""
RESOURCE_NAME=""
RESOURCE_GROUP_DETAIL=""
RESOURCE_NAME=""
VM_USER_NAME=""
VM_PASSWORD=""
echo "pls login azure cli:"
az login
echo $SUBSCRIPTION
az account set --subscription "$SUBSCRIPTION"
echo $RESOURCE_GROUP
az aks get-credentials --resource-group "$RESOURCE_GROUP" --name "$RESOURCE_NAME"
az vm list-ip-addresses --resource-group "$RESOURCE_GROUP_DETAIL" -o table
for i in `az vm list-ip-addresses --resource-group $RESOURCE_GROUP_DETAIL -o table`;
   do
   echo $i is line;
   if [[ $i =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
   else
      az vm user update -u "azureuser" -p "Azureuser001" -n $i -g $RESOURCE_GROUP --name $RESOURCE_NAME
      echo "change password for node $i" 
   fi
   done
