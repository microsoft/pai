import yaml
import os
import sys


def convert_to_layout(input_dir, output_dir):
    # generate layout.yaml
    print("Migrating layout.yaml...")
    old_cluster_config_file = os.path.join(input_dir, "cluster-configuration.yaml")
    old_cluster_config = yaml.load(open(old_cluster_config_file))
    default_properties = old_cluster_config["default-machine-properties"]
    layout = {"machine-list": []}
    for node in old_cluster_config["machine-list"]:
        new_node_config = {}
        new_node_config.update(default_properties)
        new_node_config.update(node)
        new_node_config["nodename"] = node["hostip"]
        layout["machine-list"].append(new_node_config)
    layout["machine-sku"] = old_cluster_config["machine-sku"]
    # read api-server ip from kubernetes-configuration.yaml
    kubernetes_config = yaml.load(open(os.path.join(input_dir, "kubernetes-configuration.yaml")))
    api_servers_schema = kubernetes_config["kubernetes"]["api-servers-http-schema"] if kubernetes_config["kubernetes"].get("api-servers-http-schema") is not None else "http"
    api_servers_port = kubernetes_config["kubernetes"]["api-servers-port"] if kubernetes_config["kubernetes"].get("api-servers-port") is not None else "8080"
    # got dashboard ip
    dashboard_ip = ""
    for node in old_cluster_config["machine-list"]:
        if ("dashboard" in node and (node["dashboard"] == "true")):
            dashboard_ip = node["hostip"]
            break
    # assign api-servers-url and dashboard-url
    layout["kubernetes"] = {
        "api-servers-url": api_servers_schema + "://"+kubernetes_config["kubernetes"]["load-balance-ip"]+":" + api_servers_port,
        "dashboard-url": "http://"+dashboard_ip+":9090"}

    # write out the file
    layout_file = os.path.join(output_dir, "layout.yaml")
    if(os.path.exists(layout_file)):
        print"!!! Error, file already existing:", layout_file
        sys.exit(-1)

    with open(layout_file, 'w') as outfile:
        yaml.dump(layout, outfile, default_flow_style=False)
