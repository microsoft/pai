import argparse
import sys
from schema import Schema, Or, Optional, Regex

# pylint: disable=import-error
from utils import get_logger, load_yaml_config, get_masters_workers_from_layout


logger = get_logger(__name__)


def validate_layout_schema(layout):
    schema = Schema(
        {
            # leave `kubernetes` for legacy reasons
            Optional('kubernetes'): {
                'api-servers-url': str,
                'dashboard-url': str,
            },
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
                    # https://github.com/kubernetes-sigs/kubespray/blob/release-2.11/roles/kubernetes/preinstall/tasks/0020-verify-settings.yml#L124
                    'hostname': Regex(r"^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$"),
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
            logger.error("machine-type %s is not defined", machine['machine-type'])
            return False

    masters, workers = get_masters_workers_from_layout(layout)
    # only one pai-master
    if len(masters) == 0:
        logger.error('No master machine specified.')
        return False
    if len(masters) > 1:
        logger.error('More than one master machine specified.')
        return False
    # at least one pai-worker
    if len(workers) == 0:
        logger.error('No worker machine specified.')
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
