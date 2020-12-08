import os
import sys
import argparse
import logging
import logging.config
import yaml
import jinja2


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

    masters = list(filter(lambda elem: 'pai-master' in elem and elem["pai-master"] == 'true', layout['machine-list']))
    workers = list(filter(lambda elem: 'pai-worker' in elem and elem["pai-worker"] == 'true', layout['machine-list']))
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
        if user_input == "Y" and ('openpai_kube_network_plugin' not in cluster_config or cluster_config['openpai_kube_network_plugin'] == 'calico'):
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
