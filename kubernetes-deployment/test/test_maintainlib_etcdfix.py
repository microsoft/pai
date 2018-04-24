# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import unittest
import filecmp
import os
import yaml
import tarfile
import shutil
import sys
import logging
import logging.config

from k8sPaiLibrary.maintainlib import etcdfix
from k8sPaiLibrary.maintainlib import common


class TestMaintainlibEtcdFix(unittest.TestCase):

    """
        Test the EtcdFix's api
    """

    def setUp(self):

        try:

            os.chdir(os.path.abspath("test"))

        except:

            pass

        configuration_path = "test_logging.yaml"

        if os.path.exists(configuration_path):
            with open(configuration_path, 'rt') as f:
                logging_configuration = yaml.safe_load(f.read())

            logging.config.dictConfig(logging_configuration)

            logging.getLogger()



    def tearDown(self):

        try:

            os.chdir(os.path.abspath(".."))

        except:

            pass



    def test_etcdfix_conf_validation_node_config_validation(self):

        node_list = common.load_yaml_file("data/data_maintainlib_etcdfix/test_node_list_config.yaml")
        cluster_config = common.load_yaml_file("data/data_maintainlib_etcdfix/test_cluster_config_ok.yaml")

        node_config = node_list['machinelist']['ok-machine-node']
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertTrue(validation.node_conf_validation())


        node_config = node_list['machinelist']['miss-node-name']
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.node_conf_validation())


        node_config = node_list['machinelist']['miss-host-ip']
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.node_conf_validation())


        node_config = node_list['machinelist']['wrong-host-ip']
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.node_conf_validation())


        node_config = node_list['machinelist']['wrong-ssh-port']
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.node_conf_validation())


        node_config = node_list['machinelist']['miss-user-name']
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.node_conf_validation())


        node_config = node_list['machinelist']['miss-password']
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.node_conf_validation())


        node_config = node_list['machinelist']['miss-etcd-id']
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.node_conf_validation())



    def test_etcdfix_conf_validation_cluster_config_validation(self):

        node_list = common.load_yaml_file("data/data_maintainlib_etcdfix/test_node_list_config.yaml")
        node_config = node_list['machinelist']['ok-machine-node']


        cluster_config = common.load_yaml_file("data/data_maintainlib_etcdfix/test_cluster_config_ok.yaml")
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertTrue(validation.cluster_conf_validation())


        cluster_config = common.load_yaml_file("data/data_maintainlib_etcdfix/test_cluster_config_miss_master_list.yaml")
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.cluster_conf_validation())


        cluster_config = common.load_yaml_file("data/data_maintainlib_etcdfix/test_cluster_config_miss_node_config.yaml")
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.cluster_conf_validation())


        cluster_config = common.load_yaml_file("data/data_maintainlib_etcdfix/test_cluster_config_wrong_node_config.yaml")
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.cluster_conf_validation())


        cluster_config = common.load_yaml_file("data/data_maintainlib_etcdfix/test_cluster_config_inconsistent_node_config.yaml")
        validation = etcdfix.etcdfix_conf_validation(cluster_config, node_config)
        self.assertFalse(validation.cluster_conf_validation())






