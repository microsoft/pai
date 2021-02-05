import os
import sys
import argparse

# pylint: disable=import-error
from utils import get_logger, load_yaml_config, generate_template_file, get_masters_workers_from_layout


logger = get_logger(__name__)


def get_docker_cache_config_and_mirrors(layout, cluster_config):
    """
    generate hived config from layout.yaml and config.yaml
    Resources (gpu/cpu/mem) specified in layout.yaml is considered as the total resources.

    Parameters:
    -----------
    layout: dict
        layout
    cluster_config: dict
        cluster config

    Returns:
    --------
    dict, list
        docker-cache mirrors, used to render docker-cache mirrors template
        Example:
        {
            "azure_account_name": "",
            "azure_account_key": "",
            "azure_container_name": "dockerregistry",
            "remote_url": "",
            "registry-htpasswd": "",
        }, [mirror_list]
    """
    pai_master_ips = []
    for machine in layout['machine-list']:
        if 'pai-master' in machine and machine['pai-master'] == 'true':
            pai_master_ips.append(machine['hostip'])
    docker_cache_mirrors = ["http://{}:30500".format(ip) for ip in pai_master_ips]

    if "docker_cache_azure_container_name" not in cluster_config:
        cluster_config['docker_cache_azure_container_name'] = "dockerregistry"
    if "docker_cache_remote_url" not in cluster_config:
        cluster_config['docker_cache_remote_url'] = "https://registry-1.docker.io"
    if "docker_cache_htpasswd" in cluster_config:
        cluster_config["docker_cache_htpasswd"] = ""
    docker_cache_config = {
        "azure_account_name": cluster_config['docker_cache_azure_account_name'],
        "azure_account_key": cluster_config['docker_cache_azure_account_key'],
        "azure_container_name": cluster_config['docker_cache_azure_container_name'],
        "remote_url": cluster_config['docker_cache_remote_url'],
        "registry_htpasswd": cluster_config['docker_cache_htpasswd'],
    }

    return docker_cache_config, docker_cache_mirrors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-l', '--layout', dest="layout", required=True,
                        help="layout.yaml")
    parser.add_argument('-c', '--config', dest="config", required=True,
                        help="cluster configuration")
    parser.add_argument('-o', '--output', dest="output", required=True,
                        help="cluster configuration")
    args = parser.parse_args()

    output_path = os.path.expanduser(args.output)

    layout = load_yaml_config(args.layout)
    cluster_config = load_yaml_config(args.config)

    masters, workers = get_masters_workers_from_layout(layout)
    head_node = masters[0]

    if 'openpai_kube_network_plugin' not in cluster_config or cluster_config['openpai_kube_network_plugin'] != 'weave':
        count_input = 0
        while True:
            user_input = input("Are your cluster is in Azure cloud or not? (Y/N) (case sensitive)")
            if user_input == "N":
                break
            if user_input == "Y":
                break
            print(" Please type Y or N. It's case sensitive.")
            count_input = count_input + 1
            if count_input == 3:
                logger.warning("3 Times.........  Sorry,  we will force stopping your operation.")
                sys.exit(1)
        if user_input == "Y" \
            and ('openpai_kube_network_plugin' not in cluster_config or cluster_config['openpai_kube_network_plugin'] == 'calico'):
            logger.warning("Azure does not support calico, please change the openpai_kube_network_plugin to weave")
            logger.warning("https://docs.projectcalico.org/reference/public-cloud/azure#why-doesnt-azure-support-calico-networking")
            sys.exit(1)

    # Docker-cache is disabled by default.
    # But if the user sets enable_hived_scheduler to true manually,
    # we should enable it.
    if 'enable_docker_cache' in cluster_config and cluster_config['enable_docker_cache'] is True:
        docker_cache_config, docker_cache_mirrors = get_docker_cache_config_and_mirrors(layout, cluster_config)
    else:
        docker_cache_config, docker_cache_mirrors = {}, []
        cluster_config['enable_docker_cache'] = False

    if "openpai_docker_registry_mirrors" in cluster_config:
        cluster_config["openpai_docker_registry_mirrors"] += docker_cache_mirrors 
    else:
        cluster_config["openpai_docker_registry_mirrors"] = docker_cache_mirrors
    if "openpai_docker_insecure_registries" in cluster_config:
        cluster_config["openpai_docker_insecure_registries"] += docker_cache_mirrors
    else:
        cluster_config["openpai_docker_insecure_registries"] = docker_cache_mirrors

    environment = {
        'masters': masters,
        'workers': workers,
        'cfg': cluster_config,
        'head_node': head_node
    }

    map_table = {
        "env": environment
    }
    generate_template_file(
        "quick-start/hosts.yml.template",
        "{0}/hosts.yml".format(output_path),
        map_table
    )
    generate_template_file(
        "quick-start/openpai.yml.template",
        "{0}/openpai.yml".format(output_path),
        map_table
    )


if __name__ == "__main__":
    main()
