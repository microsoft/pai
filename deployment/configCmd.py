import os
import argparse
from deployment.confStorage.download import download_configuration
from deployment.confStorage.synchronization import synchronization
from deployment.confStorage.external_version_control.external_config import uploading_external_config
from deployment.confStorage.get_cluster_id import get_cluster_id
from utility import pai_version

import logging
import logging.config
import importlib
from paiLibrary.common import file_handler
from paiLibrary.common import template_handler
from k8sPaiLibrary.maintainlib import common as pai_common


logger = logging.getLogger(__name__)


def generate_configuration(quick_start_config_file, configuration_directory, force):
    """Automatically generate the following configuration files from a quick-start file:
        * Machine-level configurations: laylout.yaml
        * Kubernetes-level configurations I: kubernetes-configuration.yaml
        * Kubernetes-level configurations II: k8s-role-definition.yaml
        * Service-level configurations: service-configuration.yaml
    """
    quick_start_config_raw = file_handler.load_yaml_config(quick_start_config_file)

    #
    # Prepare machine list
    machine_list = []
    for m in quick_start_config_raw["machines"]:
        machine = {"hostip": m, "machine-type": "GENERIC"}
        # TODO on premise, using ip as "nodename"
        machine["nodename"] = m
        machine["docker-data"] = "/var/lib/docker"
        machine["username"] = quick_start_config_raw["ssh-username"]
        if "ssh-password" in quick_start_config_raw:
            machine["password"] = quick_start_config_raw["ssh-password"]
        else:
            machine["ssh-keyfile-path"] = quick_start_config_raw["ssh-keyfile-path"]
            machine["ssh-secret-name"] = quick_start_config_raw["ssh-secret-name"]
        machine["ssh-port"] = 22 if "ssh-port" not in quick_start_config_raw else quick_start_config_raw["ssh-port"]

        machine_list.append(machine)

    # workers
    worker_noders = machine_list[1:] if len(machine_list) > 1 else machine_list
    for machine in worker_noders:
        # k8s attributes
        machine["k8s-role"] = "worker"
        # PAI attributes
        machine["pai-worker"] = "true"

    # master
    master_node = machine_list[0]
    # k8s attributes
    master_node["k8s-role"] = "master"
    master_node["etcdid"] = "etcdid1"
    master_node["dashboard"] = "true"
    # PAI attributes
    master_node["pai-master"] = "true"
    master_node["zkid"] = "1"

    #
    # Prepare config of cluster IP range.
    service_cluster_ip_range = \
        "10.254.0.0/16" if "service-cluster-ip-range" not in quick_start_config_raw \
        else quick_start_config_raw["service-cluster-ip-range"]
    #
    # Auto-complete missing configuration items: Part 1 -- DNS.
    if "dns" in quick_start_config_raw:
        dns = quick_start_config_raw["dns"]
    else:
        result_stdout, result_stderr = pai_common.ssh_shell_paramiko_with_result(
            master_node,
            "cat /etc/resolv.conf | grep nameserver | cut -d ' ' -f 2 | head -n 1")
        dns = result_stdout.strip()
    #
    # Auto-complete missing configuration items: Part 2 -- hostnames.
    for host_config in machine_list:
        result_stdout, result_stderr = pai_common.ssh_shell_paramiko_with_result(
            host_config,
            "hostname")
        host_config["hostname"] = result_stdout.strip()

    #
    # kubernetes info
    api_servers_url = "http://{0}:{1}".format(master_node["hostip"], 8080)
    # TODO we some k8s template still using the 'dashboard_host'
    dashboard_host = master_node["hostip"]
    dashboard_url = "http://{0}:{1}".format(master_node["hostip"], 9090)

    #
    # Generate configuration files.
    target_file_names = [
        "layout.yaml",
        "kubernetes-configuration.yaml",
        "k8s-role-definition.yaml",
        "services-configuration.yaml"
    ]
    for x in target_file_names:
        target_file_path = os.path.join(configuration_directory, x)
        if file_handler.file_exist_or_not(target_file_path) and force is False:
            logger.warning("File %s exists. Skip." % (target_file_path))
            pass
        else:
            file_handler.create_folder_if_not_exist(configuration_directory)
            file_handler.write_generated_file(
                target_file_path,
                template_handler.generate_from_template_dict(
                    file_handler.read_template("./deployment/quick-start/%s.template" % (x)),
                    {"env":
                        {
                            "machines": machine_list,
                            "dns": dns,
                            "load-balance-ip": master_node["hostip"],
                            "service-cluster-ip-range": service_cluster_ip_range,
                            "api-servers-url": api_servers_url,
                            "dashboard-host": dashboard_host,
                            "dashboard-url": dashboard_url,
                            "pai-version": pai_version.paictl_version()
                        }
                     }))


class ConfigCmd():

    def register(self, parser):
        conf_parser = parser.add_subparsers(help="configuration operations")

        # ./paictl.py config generate ...
        generate_parser = conf_parser.add_parser("generate", description="Generate configuration files based on a quick-start yaml file.", formatter_class=argparse.RawDescriptionHelpFormatter)
        generate_parser.add_argument("-i", "--input", dest="quick_start_config_file", required=True, help="the path of the quick-start configuration file (yaml format) as the input")
        generate_parser.add_argument("-o", "--output", dest="configuration_directory", required=True, help="the path of the directory the configurations will be generated to")
        generate_parser.add_argument("-f", "--force", dest="force", action="store_true", default=False,  help="overwrite existing files")
        generate_parser.set_defaults(handler=self.generate_configuration)

        # ./paictl.py config push ...
        push_parser = conf_parser.add_parser("push", description="Push configuration to kubernetes cluster as configmap.", formatter_class=argparse.RawDescriptionHelpFormatter)
        mutually_update_option = push_parser.add_mutually_exclusive_group()
        mutually_update_option.add_argument("-p", "--cluster-conf-path", dest="cluster_conf_path", default=None, help="the path of directory which stores the cluster configuration.")
        mutually_update_option.add_argument("-e", "--external-storage-conf-path", dest="external_storage_conf_path",  default=None, help="the path of external storage configuration.")
        push_parser.add_argument("-m", "--push-mode", dest="push_mode", default="all", choices=['all', 'service'], help="the mode to push configuration. service mode won't push the k8s related configuration." )
        push_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config", help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")
        push_parser.set_defaults(handler=self.push_configuration)

        # ./paictl.py config pull ...
        pull_parser = conf_parser.add_parser("pull", description="Get the configuration stored in the k8s cluster.", formatter_class=argparse.RawDescriptionHelpFormatter)
        pull_parser.add_argument("-o", "--config-output-path", dest="config_output_path", required=True, help="the path of the directory to store the configuration downloaded from k8s.")
        pull_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config", help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")
        pull_parser.set_defaults(handler=self.pull_configuration)

        # ./paictl.py config get-id ...
        get_id_parser = conf_parser.add_parser("get-id", description="Get the cluster-id stored in the k8s cluster.", formatter_class=argparse.RawDescriptionHelpFormatter)
        get_id_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config", help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")
        get_id_parser.set_defaults(handler=self.get_cluster_id)

        # ./paictl.py config external-config-update ...
        external_config_update_parser = conf_parser.add_parser("external-config-update", description="Update configuration of external storage where you could configure the place to sync the latest cluster configuration", formatter_class=argparse.RawDescriptionHelpFormatter)
        external_config_update_parser.add_argument("-e", "--extneral-storage-conf-path", dest="external_storage_conf_path", required=True, help="the path of external storage configuration.")
        external_config_update_parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config", help="The path to KUBE_CONFIG gile. Default value: ~/.kube/config")
        external_config_update_parser.set_defaults(handler=self.update_external_config)

    def generate_configuration(self, args):
        generate_configuration(
            args.quick_start_config_file,
            args.configuration_directory,
            args.force)

    def push_configuration(self, args):
        if args.cluster_conf_path != None:
            args.cluster_conf_path = os.path.expanduser(args.cluster_conf_path)
        if args.external_storage_conf_path != None:
            args.external_storage_conf_path = os.path.expanduser(args.external_storage_conf_path)
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)
        push_list = [
            "k8s-role-definition.yaml",
            "kubernetes-configuration.yaml",
            "layout.yaml",
            "services-configuration.yaml"
        ]
        if args.push_mode == "service":
            push_list = [
                "layout.yaml",
                "services-configuration.yaml"
            ]
        sync_handler = synchronization(
            pai_cluster_configuration_path=args.cluster_conf_path,
            local_conf_path=args.external_storage_conf_path,
            kube_config_path=args.kube_config_path,
            config_push_list = push_list
        )
        sync_handler.sync_data_from_source()

    def pull_configuration(self, args):
        if args.config_output_path != None:
            args.config_output_path = os.path.expanduser(args.config_output_path)
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)
        get_handler = download_configuration(
            config_output_path=args.config_output_path,
            kube_config_path=args.kube_config_path
        )
        get_handler.run()

    def get_cluster_id(self, args):
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)
        get_id_handler = get_cluster_id(kube_config_path=args.kube_config_path)
        get_id_handler.run()

    def update_external_config(self, args):
        if args.kube_config_path != None:
            args.kube_config_path = os.path.expanduser(args.kube_config_path)
        if args.external_storage_conf_path != None:
            args.external_storage_conf_path = os.path.expanduser(args.external_storage_conf_path)
        external_conf_update = uploading_external_config(
            external_storage_conf_path=args.external_storage_conf_path,
            kube_config_path=args.kube_config_path
        )
        external_conf_update.update_latest_external_configuration()
