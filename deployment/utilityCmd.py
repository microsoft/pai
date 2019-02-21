import os
import sys
import logging
import logging.config

from deployment.utility.ssh import OpenPaiSSH
from deployment.utility.sftp_copy import OpenPaiSftpCopy
from clusterObjectModel.cluster_object_model import cluster_object_model

logger = logging.getLogger(__name__)


class UtilityCmd():
    def register(self, parser):
        utility_parser = parser.add_subparsers(help="utility for maintaining in a easy way.")

        ssh_parser = utility_parser.add_parser("ssh")
        ssh_parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="path of cluster configuration file")
        ssh_parser.add_argument("-f", "--filter", dest="filter", nargs='+', help="Rule to filter machine. Format: key1=value1 key2=value2 ...")
        ssh_parser.add_argument("-c", "--command", dest="command", required=True, help="The command to be executed remotely.")
        ssh_parser.set_defaults(handler=self.cluster_ssh)

        sftp_cp_parser = utility_parser.add_parser("sftp-copy")
        sftp_cp_parser.add_argument("-f", "--filter", dest="filter", nargs='+', help="Rule to filter machine. Format: key1=value1 key2=value2 ...")
        sftp_cp_parser.add_argument("-n", "--file-name", dest="file_name", required=True, help="File Name.")
        sftp_cp_parser.add_argument("-s", "--source", dest="source", required=True, help="The source path of the file.")
        sftp_cp_parser.add_argument("-d", "--destination", dest="dest", required=True, help="The target path of the file in the remote machines.")
        sftp_cp_parser.add_argument("-p", "--config-path", dest="config_path", required=True, help="path of cluster configuration file")
        sftp_cp_parser.set_defaults(handler=self.cluster_sftp_copy)

    def get_machine_list(self, config_path):
        objectModelFactoryHandler = cluster_object_model(configuration_path=config_path)
        return objectModelFactoryHandler.kubernetes_config()["layout"]["machine-list"]

    def rule_check(self, rule_list):
        if rule_list == None:
            return
        for rule in rule_list:
            kv = rule.split("=")
            if len(kv) != 2:
                logger.error("Please check the filter rule {0}. It's invalid.".format(rule))
                sys.exit(1)

    def cluster_ssh(self, args):
        if args.config_path != None:
            args.config_path = os.path.expanduser(args.config_path)
            machine_list = self.get_machine_list(args.config_path)
        else:
            machine_list = {}
        self.rule_check(args.filter)
        ssh_handler = OpenPaiSSH(args.command, machine_list, args.filter)
        ssh_handler.run()

    def cluster_sftp_copy(self, args):
        if args.config_path != None:
            args.config_path = os.path.expanduser(args.config_path)
            machine_list = self.get_machine_list(args.config_path)
        else:
            machine_list = {}
        if args.source != None:
            args.source = os.path.expanduser(args.source)
        if args.dest != None and os.path.isabs(args.dest) is not True:
            logger.error("The path of destination should an absolute path.")
            sys.exit(1)
        self.rule_check(args.filter)
        sftp_copy_handler = OpenPaiSftpCopy(args.file_name, args.source, args.dest, machine_list, args.filter)
        sftp_copy_handler.run()
