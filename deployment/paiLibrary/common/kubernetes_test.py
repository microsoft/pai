import kubernetes_handler


kube_config_path = "/root/.kube/config"

node_list = kubernetes_handler.list_all_nodes(kube_config_path)
print node_list[0].metadata.name
print node_list[0].status.addresses
print node_list[0].status.addresses[0].type
print node_list[0].status.addresses[0].address