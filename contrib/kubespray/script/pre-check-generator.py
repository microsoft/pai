import os
import argparse
import logging
import logging.config
import yaml
import jinja2
from kubernetes.utils import parse_quantity
import math
from collections import defaultdict

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
    config = load_yaml_config(args.config)

    masters = list(filter(lambda elem: 'pai-master' in elem and elem["pai-master"] == 'true', layout['machine-list']))
    workers = list(filter(lambda elem: 'pai-worker' in elem and elem["pai-worker"] == 'true', layout['machine-list']))
    head_node = masters[0]

    # fill in cpu, memory, computing_device information in both masters and workers
    # we assume the layout file the user gives is correct
    all_machines = masters + workers
    for machine in all_machines:
        sku_info = layout['machine-sku'][machine['machine-type']]
        # use math.ceil to guarantee the memory volume 
        # e.g. if use set 999.1MB, we ensure there is 1000MB to avoid scheduling issues
        machine['memory_mb'] = math.ceil(parse_quantity(sku_info['mem']) / 1024 / 1024)
        machine['cpu_vcores'] = sku_info['cpu']['vcore']
        if 'computing-device' in sku_info:
            machine['computing_device'] = sku_info['computing-device']

    # add machine to different comupting device group
    computing_device_groups = defaultdict(list)
    for machine in all_machines:
        sku_info = layout['machine-sku'][machine['machine-type']]
        if 'computing-device' in sku_info:
            computing_device_groups[sku_info['computing-device']['type']].append(machine['hostname'])

    environment = {
        'masters': masters,
        'workers': workers,
        'cfg': config,
        'head_node': head_node,
        'computing_device_groups': computing_device_groups,
    }

    map_table = {
        "env": environment
    }

    generate_template_file(
        "quick-start/pre-check.yml.template",
        "{0}/pre-check.yml".format(output_path),
        map_table
    )


if __name__ == "__main__":
    main()
