import os
import sys
import re
import argparse
import logging
import logging.config
from decimal import Decimal
import yaml
import jinja2
from kubernetes.utils import parse_quantity

# reserved resources
PAI_RESERVE_RESOURCE_PERCENTAGE = 0.01
PAI_MAX_RESERVE_CPU_PER_NODE = 0.5
PAI_MAX_RESERVE_MEMORY_PER_NODE = 1024 # 1Gi

KUBE_RESERVED_CPU = 0.01 # 100m
KUBE_RESERVED_MEM = 256 # Mi
SYSTEM_RESERVED_CPU = 0
SYSTEM_RESERVED_MEM = 0
EVICTION_HARD_MEM = 100 #Mi


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


def get_pai_daemon_resource_request(cfg):
    ret = {
        "cpu-resource": 0,
        "mem-resource": 0
    }
    if "qos-switch" not in cfg or cfg["qos-switch"] == "false":
        logger.info("Ignore calculate pai daemon resource usage since qos-switch set to false")
        return ret

    pai_daemon_services = ["node-exporter", "job-exporter", "log-manager"]
    pai_source_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../../src")

    # {%- if cluster_cfg['cluster']['common']['qos-switch'] == "true" %}
    start_match = r"{%-?\s*if\s*cluster_cfg\['cluster'\]\['common'\]\['qos-switch'\][^}]+%}"
    end_match = r"{%-?\s*endif\s*%}"  # {%- end %}
    str_match = "{}(.*?){}".format(start_match, end_match)
    regex = re.compile(str_match, flags=re.DOTALL)

    for pai_daemon in pai_daemon_services:
        deploy_template_path = os.path.join(pai_source_path, "{0}/deploy/{0}.yaml.template".format(pai_daemon))
        if os.path.exists(deploy_template_path):
            template = read_template(deploy_template_path)
            match = regex.search(template)
            if not match:
                logger.warning("Could not find resource request for service %s", pai_daemon)
                continue
            resources = yaml.load(match.group(1), yaml.SafeLoader)["resources"]
            if "requests" in resources:
                ret["cpu-resource"] += parse_quantity(resources["requests"].get("cpu", 0))
                ret["mem-resource"] += parse_quantity(resources["requests"].get("memory", 0)) / 1024 / 1024
            elif "limits" in resources:
                ret["cpu-resource"] += parse_quantity(resources["limits"].get("cpu", 0))
                ret["mem-resource"] += parse_quantity(resources["limits"].get("memory", 0)) / 1024 / 1024
        else:
            logger.warning("Could not find resource request for PAI daemon %s", pai_daemon)
    return ret


def get_hived_config(layout, config):
    """
    generate hived config from layout.yaml and config.yaml
    Resources (gpu/cpu/mem) specified in layout.yaml is considered as the total resources.

    Parameters:
    -----------
    layout: dict
        layout
    config: dict
        config

    Returns:
    --------
    dict
        hived config, used to render hived config template
    """
    pai_daemon_resource_dict = get_pai_daemon_resource_request(config)
    sku_specs = {}
    for sku_name, sku_spec in layout['machine-sku'].items():
        # save memory with unit Mi
        sku_spec['mem'] = parse_quantity(sku_spec['mem']) / 1024 / 1024

        # calculate reserved resources
        pai_reserved_cpu = min(sku_spec['cpu']['vcore'] * Decimal(PAI_RESERVE_RESOURCE_PERCENTAGE), Decimal(PAI_MAX_RESERVE_CPU_PER_NODE))
        pai_reserved_mem = min(sku_spec['mem'] * Decimal(PAI_RESERVE_RESOURCE_PERCENTAGE), Decimal(PAI_MAX_RESERVE_MEMORY_PER_NODE))
        reserved_cpu = SYSTEM_RESERVED_CPU + KUBE_RESERVED_CPU + pai_reserved_cpu + pai_daemon_resource_dict["cpu-resource"]
        reserved_mem = SYSTEM_RESERVED_MEM + KUBE_RESERVED_MEM + EVICTION_HARD_MEM + pai_reserved_mem + pai_daemon_resource_dict["mem-resource"]

        if sku_spec['cpu']['vcore'] <= reserved_cpu or sku_spec['mem'] <= reserved_mem:
            logger.error("The node resource does not satisfy minmal requests. Toal cpu: %s, mem: %sMB; Reserved cpu:%s, mem: %sMB.",
                sku_spec['cpu']['vcore'], sku_spec['mem'], reserved_cpu, reserved_mem)
            sys.exit(1)

        # check if the machine has GPUs
        if 'computing-device' in sku_spec:
            sku_specs[sku_name] = {
                'cpu': int((sku_spec['cpu']['vcore'] - reserved_cpu) / sku_spec['computing-device']['count']),
                'mem': int((sku_spec['mem'] - reserved_mem) / sku_spec['computing-device']['count']),
                'gpu': True,
                'gpuCount': sku_spec['computing-device']['count'],
            }
        else:
            sku_specs[sku_name] = {
                'cpu': int(sku_spec['cpu']['vcore'] - reserved_cpu),
                'mem': int(sku_spec['mem'] - reserved_mem),
            }

    skus = {}
    for machine in layout['machine-list']:
        if 'pai-worker' in machine and machine['pai-worker'] == 'true':
            sku_name = machine['machine-type']
            sku_spec = sku_specs[sku_name]
            if sku_name not in skus:
                skus[sku_name] = sku_spec.copy()
                skus[sku_name]['workers'] = [machine['hostname']]
            else:
                skus[sku_name]['workers'].append(machine['hostname'])

    if not bool(skus):
        logger.error("No worker node is detected.")
        sys.exit(1)

    return { "skus": skus }


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

    hived_config = get_hived_config(layout, config)

    environment = {
        'masters': masters,
        'workers': workers,
        'cfg': config,
        'head_node': head_node,
        'hived': hived_config
    }

    map_table = {
        "env": environment
    }

    generate_template_file(
        os.path.abspath(os.path.join(os.path.abspath(__file__), '../../quick-start/services-configuration.yaml.template')),
        "{0}/services-configuration.yaml".format(output_path),
        map_table
    )


if __name__ == "__main__":
    main()
