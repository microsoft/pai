import os
import sys
import argparse

# pylint: disable=import-error
from utils import get_logger, load_yaml_config, generate_template_file, get_masters_workers_from_layout


logger = get_logger(__name__)


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
