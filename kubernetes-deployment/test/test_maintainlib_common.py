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

from k8sPaiLibrary.maintainlib import common


class TestMaintainlibCommon(unittest.TestCase):

    """
    Test the common's api
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



    def test_yaml_lod(self):
        pass



    def test_template2generated(self):

        cluster_data = {
            'clusterinfo' : {
                'testkey2' : 'testkey2'
            },
            'testkey3': 'testkey3'
        }

        host_data = {
            'testkey1': 'testkey1'
        }

        template_data = common.read_template("data/data_maintainlib_common/test.yaml")
        generated_data = common.generate_from_template(template_data, cluster_data, host_data)
        common.write_generated_file(generated_data, "data/data_maintainlib_common/output.yaml")

        self.assertTrue(
            filecmp.cmp(
                "data/data_maintainlib_common/test.yaml",
                "data/data_maintainlib_common/output.yaml"
            )
        )

        os.remove("data/data_maintainlib_common/output.yaml")



    def test_template2generated_dict(self):

        cluster_data = {
            'clusterinfo' : {
                'testkey2' : 'testkey2'
            },
            'testkey3': 'testkey3'
        }

        host_data = {
            'testkey1': 'testkey1'
        }

        dict_map = {
            "hostcofig": host_data,
            "clusterconfig": cluster_data['clusterinfo'],
            "cluster": cluster_data
        }

        template_data = common.read_template("data/data_maintainlib_common/test.yaml")
        generated_data = common.generate_from_template_dict(template_data, dict_map)
        common.write_generated_file(generated_data, "data/data_maintainlib_common/output.yaml")

        self.assertTrue(
            filecmp.cmp(
                "data/data_maintainlib_common/test.yaml",
                "data/data_maintainlib_common/output.yaml"
            )
        )

        os.remove("data/data_maintainlib_common/output.yaml")



    def test_package_common_1(self):

        maintain_config = common.load_yaml_file("test-maintain.yaml")
        cluster_config = common.load_yaml_file("test-cluster-config.yaml")
        node_config = cluster_config['workermachinelist']['worker-01']


        common.maintain_package_wrapper(cluster_config, maintain_config, node_config, "unittest-common-1")
        self.assertTrue(os.path.exists("parcel-center/1.2.3.2/unittest-common-1.tar"))


        package = tarfile.open("parcel-center/1.2.3.2/unittest-common-1.tar", "r:")
        package.extractall()
        self.assertTrue(os.path.exists("unittest-common-1/"))


        target_file_list = ["testfile1.sh", "testfile2.sh"]
        package_file_list = os.listdir("unittest-common-1/")
        self.assertListEqual(sorted(target_file_list), sorted(package_file_list))
        shutil.rmtree("unittest-common-1/")

        common.maintain_package_cleaner(node_config)
        self.assertFalse(os.path.exists("parcel-center/1.2.3.2"))
        self.assertTrue(os.path.exists("parcel-center"))

        shutil.rmtree("parcel-center/")



    def test_package_common_2(self):

        maintain_config = common.load_yaml_file("test-maintain.yaml")
        cluster_config = common.load_yaml_file("test-cluster-config.yaml")
        node_config = cluster_config['workermachinelist']['worker-01']


        common.maintain_package_wrapper(cluster_config, maintain_config, node_config, "unittest-common-2")
        self.assertTrue(os.path.exists("parcel-center/1.2.3.2/unittest-common-2.tar"))


        package = tarfile.open("parcel-center/1.2.3.2/unittest-common-2.tar", "r:")
        package.extractall()
        self.assertTrue(os.path.exists("unittest-common-2/"))


        target_file_list = ["testfile2.sh"]
        package_file_list = os.listdir("unittest-common-2/")
        self.assertListEqual(sorted(target_file_list), sorted(package_file_list))
        shutil.rmtree("unittest-common-2/")

        common.maintain_package_cleaner(node_config)
        self.assertFalse(os.path.exists("parcel-center/1.2.3.2"))
        self.assertTrue(os.path.exists("parcel-center"))

        shutil.rmtree("parcel-center/")



    def test_package_common_3(self):

        maintain_config = common.load_yaml_file("test-maintain.yaml")
        cluster_config = common.load_yaml_file("test-cluster-config.yaml")
        node_config = cluster_config['workermachinelist']['worker-01']


        common.maintain_package_wrapper(cluster_config, maintain_config, node_config, "unittest-common-3")
        self.assertTrue(os.path.exists("parcel-center/1.2.3.2/unittest-common-3.tar"))


        package = tarfile.open("parcel-center/1.2.3.2/unittest-common-3.tar", "r:")
        package.extractall()
        self.assertTrue(os.path.exists("unittest-common-3/"))


        target_file_list = ["testfile1.sh"]
        package_file_list = os.listdir("unittest-common-3/")
        self.assertListEqual(sorted(target_file_list), sorted(package_file_list))
        shutil.rmtree("unittest-common-3/")

        common.maintain_package_cleaner(node_config)
        self.assertFalse(os.path.exists("parcel-center/1.2.3.2"))
        self.assertTrue(os.path.exists("parcel-center"))

        shutil.rmtree("parcel-center/")



    def test_ipv4_address_validation_correct(self):

        addr1 = "128.0.0.x"
        self.assertFalse(common.ipv4_address_validation(addr1))

        addr2 = "256.0.0.0"
        self.assertFalse(common.ipv4_address_validation(addr2))

        addr3 = "128.0.0.1"
        self.assertTrue(common.ipv4_address_validation(addr3))

        addr4 = "127.0.0.1"
        self.assertTrue(common.ipv4_address_validation(addr4))

        addr5 = "mydefaultip"
        self.assertFalse(common.ipv4_address_validation(addr5))

        addr6 = "localhost"
        self.assertFalse(common.ipv4_address_validation(addr6))

        addr7 = "0.-1.0.0"
        self.assertFalse(common.ipv4_address_validation(addr7))

        addr8 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
        self.assertFalse(common.ipv4_address_validation(addr8))



    def test_port_validation(self):

        port1 = 22
        self.assertTrue(common.port_validation(port1))

        port2 = "232"
        self.assertTrue(common.port_validation(port2))

        port3 = "12xxx"
        self.assertFalse(common.port_validation(port3))

        port4 = "65536"
        self.assertFalse(common.port_validation(port4))

        port5 = "-22"
        self.assertFalse(common.port_validation(port5))

        port6 = 0
        self.assertTrue(common.port_validation(port6))





if __name__ == '__main__':


    unittest.main()
