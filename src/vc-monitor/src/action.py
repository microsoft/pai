import os
import shutil
import logging

from deployment.paiLibrary.common import file_handler, template_handler
from utils import touch_file

logger = logging.getLogger(__name__)


class YarnHandle(object):

    config_copy_list = ["core-site.xml",
                        "hadoop-env.sh",
                        "mapred-site.xml",
                        "resourcemanager-generate-script.sh",
                        "resourcemanager-start-service.sh",
                        "yarn-env.sh",
                        "yarn-site.xml"]
    config_template_list = ["capacity-scheduler.xml"]
    config_ready_file = "/jobstatus/configok"

    def __init__(self, template_dir="/hadoop-configuration-configmap", dst_dir="/hadoop-configuration"):
        self.template_dir = template_dir
        self.dst_dir = dst_dir

    def update(self, cluster_config):
        self.generate_service_config_files(cluster_config, self.template_dir, self.dst_dir)
        self.update_config_status()


    @classmethod
    def generate_service_config_files(cls, cluster_config, source_dir, dst_dir):

        logger.info("Begin to copy config files")
        for copy_file in cls.config_copy_list:
            shutil.copy(os.path.join(source_dir, copy_file), os.path.join(dst_dir, copy_file))

        logger.info("Begin to generate template files")
        for template_file in cls.config_template_list:
            template_path = os.path.join(source_dir, template_file + ".template")
            dst_path = os.path.join(dst_dir, template_file)
            template_data = file_handler.read_template(template_path)
            try:
                logger.debug("Generate template file from {0} to {1}".format(template_path, dst_path))
                generated_template = template_handler.generate_from_template_dict(template_data, cluster_config)
            except Exception as e:
                logger.exception("Failed to generate template file from {} with dict {}".format(template_path,
                                                                                                cluster_config))
                raise e
            logger.debug("Write template config to {}".format(dst_path))
            file_handler.write_generated_file(dst_path, generated_template)

    @classmethod
    def update_config_status(cls):
        logger.debug("Update config ready file")
        touch_file(cls.config_ready_file)
