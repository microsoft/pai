import argparse
import logging
import logging.config
import sys
from schema import Schema, Or, Optional, Regex
import yaml


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


def validate_layout_schema(layout):
    schema = Schema(
        {
            'machine-sku': {
                str: {
                    'mem': str,
                    'cpu': {
                        'vcore': int,
                    },
                    Optional('computing-device'): {
                        'type': str,
                        'model': str,
                        'count': int,
                    }
                }
            },
            'machine-list': [
                {
                    'hostname': str,
                    'hostip': Regex(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$"),
                    'machine-type': str,
                    Optional('pai-master'): Or('true', 'false'),
                    Optional('pai-worker'): Or('true', 'false'),
                    Optional('pai-storage'): Or('true', 'false'),
                }
            ]
        }
    )
    return schema.validate(layout)


def check_layout(layout):
    # hostname / hostip should be unique
    hostnames = [elem['hostname'] for elem in layout['machine-list']]
    if len(hostnames) != len(set(hostnames)):
        logger.error("hostname should be unique")
        return False
    hostips = [elem['hostip'] for elem in layout['machine-list']]
    if len(hostips) != len(set(hostips)):
        logger.error("hostip should be unique")
        return False

    # machine-type should be defined in machine-sku
    for machine in layout['machine-list']:
        if machine['machine-type'] not in layout['machine-sku']:
            logger.error("machine-type {} is not defined".format(machine['machine-type']))
            return False

    masters = list(filter(lambda elem: 'pai-master' in elem and elem["pai-master"] == 'true', layout['machine-list']))
    # only one pai-master
    if len(masters) == 0:
        logger.error('No master machine specified.')
        return False
    if len(masters) > 1:
        logger.error('More than one master machine specified.')
        return False

    # pai-master / pai-worker cannot be true at the same time
    if 'pai-worker' in masters[0] and masters[0]['pai-worker'] == 'true':
        logger.error("One machine can not be pai-master and pai-worker at the same time.")
        return False

    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-l', '--layout', dest="layout", required=True,
                        help="layout.yaml")
    args = parser.parse_args()

    layout = load_yaml_config(args.layout)
    try:
        validate_layout_schema(layout)
    except Exception as exp:
        logger.error("layout.yaml schema validation failed: \n %s", exp)
        sys.exit(1)

    if not check_layout(layout):
        logger.error("layout.yaml schema validation failed")
        sys.exit(1)

    logger.info("layout.yaml schema validation succeeded.")


if __name__ == "__main__":
    main()
