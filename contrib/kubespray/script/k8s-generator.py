import logging
import logging.config
import yaml
import os
import argparse
import csv
import jinja2
import sys
import time


def setup_logger_config(logger):
    """
    Setup logging configuration.
    """
    if len(logger.handlers) == 0:
        logger.propagate = False
        logger.setLevel(logging.DEBUG)
        consoleHandler = logging.StreamHandler()
        consoleHandler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] - %(filename)s:%(lineno)s : %(message)s')
        consoleHandler.setFormatter(formatter)
        logger.addHandler(consoleHandler)


logger = logging.getLogger(__name__)
setup_logger_config(logger)


def csv_reader(csv_path):
    hosts_list = []
    with open(csv_path) as fin:
        hosts_csv = csv.reader(fin)
        for row in hosts_csv:
            hosts_list.append(
                {
                    "hostname": row[0],
                    "ip": row[1]
                }
            )
    return hosts_list


def load_yaml_config(config_path):
    with open(config_path, "r") as f:
        config_data = yaml.load(f, yaml.SafeLoader)
    return config_data


def read_template(template_path):
    with open(template_path, "r") as f:
        template_data = f.read()
    return template_data


def generate_from_template_dict(template_data, map_table):
    generated_file = jinja2.Template(template_data).render(
        map_table
    )
    return generated_file


def write_generated_file(file_path, content_data):
    with open(file_path, "w+") as fout:
        fout.write(content_data)


def generate_template_file(template_file_path, output_path, map_table):
    template = read_template(template_file_path)
    generated_template = generate_from_template_dict(template, map_table)
    write_generated_file(output_path, generated_template)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-w', '--worker-list-csv', dest="worklist", required=True,
                        help="worker-list")
    parser.add_argument('-m', '--master-list-csv', dest="masterlist", required=True,
                        help="master-list")
    parser.add_argument('-c', '--configuration', dest="configuration", required=True,
                        help="cluster configuration")
    parser.add_argument('-o', '--output', dest="output", required=True,
                        help="cluster configuration")
    args = parser.parse_args()

    output_path = os.path.expanduser(args.output)

    master_list = csv_reader(args.masterlist)
    head_node = master_list[0]
    cluster_config = load_yaml_config(args.configuration)

    if 'openpai_kube_network_plugin' not in cluster_config or cluster_config['openpai_kube_network_plugin'] != 'weave':
        count_input = 0
        while True:
            user_input = input("Are your cluster is in Azure cloud or not? (Y/N) (case sensitive)")
            if user_input == "N":
                break
            elif user_input == "Y":
                break
            else:
                print(" Please type Y or N. It's case sensitive.")
            count_input = count_input + 1
            if count_input == 3:
                logger.warning("3 Times.........  Sorry,  we will force stopping your operation.")
                sys.exit(1)
        if user_input == "Y" and ('openpai_kube_network_plugin' not in cluster_config or cluster_config['openpai_kube_network_plugin'] == 'calico'):
            logger.warning("Azure does not support calico, please change the openpai_kube_network_plugin to weave")
            logger.warning("https://docs.projectcalico.org/reference/public-cloud/azure#why-doesnt-azure-support-calico-networking")
            sys.exit(1)

    environment = {
        'master': master_list,
        'worker': csv_reader(args.worklist),
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