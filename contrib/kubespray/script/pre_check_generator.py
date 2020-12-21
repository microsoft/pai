import os
import argparse
import math
from collections import defaultdict
from kubernetes.utils import parse_quantity

from .utils import get_logger, load_yaml_config, generate_template_file, get_masters_workers_from_layout


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
    config = load_yaml_config(args.config)

    masters, workers = get_masters_workers_from_layout(layout)
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
