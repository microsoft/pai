from clusterObjectModel.cluster_object_model import cluster_object_model
import os
import logging
import logging.config

logger = logging.getLogger(__name__)


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

        layout_file = os.path.join(config_path, "layout.yaml")
        old_cluster_config_file = os.path.join(config_path, "cluster-configuration.yaml")
        if(os.path.exists(old_cluster_config_file) and not os.path.exists(layout_file)):
            logger.error("[Error], please upgrade config files!")
            exit(-1)

        # kubernetes config
        my_cluster_object_model = cluster_object_model(args.config_path)
        kubernetes_config = my_cluster_object_model.kubernetes_config()
        logger.info("[OK] vaildate kubernetes config.")

        # pai service config
        service_config = my_cluster_object_model.service_config()
        logger.info("[OK] vaildate PAI services config.")
