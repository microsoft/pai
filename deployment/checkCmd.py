from clusterObjectModel.cluster_object_model import cluster_object_model
import os
import logging
import logging.config
import yaml
import re
from k8sPaiLibrary.maintainlib import common as pai_common

logger = logging.getLogger(__name__)


def validate_config(config_path):
    layout_file = os.path.join(config_path, "layout.yaml")
    old_cluster_config_file = os.path.join(config_path, "cluster-configuration.yaml")
    if(os.path.exists(old_cluster_config_file) and not os.path.exists(layout_file)):
        logger.error("[Error] - Please upgrade config files!")
        exit(-1)

    # kubernetes config
    my_cluster_object_model = cluster_object_model(config_path)
    kubernetes_config = my_cluster_object_model.kubernetes_config()
    logger.info("[OK] vaildate kubernetes config.")

    # pai service config
    service_config = my_cluster_object_model.service_config()
    logger.info("[OK] vaildate PAI services config.")


def validata_node_os(config_path):
    layout_file = os.path.join(config_path, "layout.yaml")
    hosts = yaml.load(open(layout_file), yaml.SafeLoader)["machine-list"]
    print hosts

    host_not_match = []
    regex = r"Description:\s+Ubuntu\s+16.04(.\d)?\s+LTS"
    for host in hosts:
        logger.info("Check os for %s ...", host["hostip"])
        result_stdout, result_stderr = pai_common.ssh_shell_paramiko_with_result(
            host,
            "sudo lsb_release -d")
        logger.info(result_stdout)
        # should match  Ubuntu 16.04.5 LTS
        if re.match(regex, result_stdout) is None:
            host_not_match.append(host["hostip"])

    if len(host_not_match) > 0:
        logger.error("[Error - unsupported OS] - OpenPAI only supports ubuntu 16.04, the following node(s) are not ubuntu 16.04: %s", host_not_match)
        exit(-1)


class CheckCmd():
    def register(self, check_parser):
        #check_parser.add_argument("--pre", dest="pre", type=bool, default=False, help="Precheck. Check the prerequisites, and valid the configuration.")
        check_parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="path of cluster configuration file")
        check_parser.set_defaults(handler=self.check)

    def check(self, args):
        # validate config

        logger.info("Begin to check config files. ")
        config_path = os.path.expanduser(args.config_path)
        logger.info("Config files directory: %s", config_path)

        validate_config(config_path)
        validata_node_os(config_path)
