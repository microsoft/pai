# -*- coding: utf-8 -*-
from __future__ import absolute_import

from mock import patch
import unittest

from operator_wrapper.kubernetes_operator import KubernetesOperator


class KubernetesOperatorTestCase(unittest.TestCase):

    def setUp(self):
        with patch('operator_wrapper.kubernetes_operator.KubernetesOperator.setup_kubernetes_configfile'):
            self.kubernetesOperator = KubernetesOperator("localhost")

    @patch('operator_wrapper.kubernetes_operator.KubernetesOperator.setup_kubernetes_configfile')
    def test__init__(self, setup_kubernetes_configfile):
        KubernetesOperator("127.0.0.1")
        setup_kubernetes_configfile.assert_called_with("127.0.0.1")

    @patch('operator_wrapper.kubernetes_operator.common')
    def test_setup_kubernetes_configfile(self, common_mock):
        common_mock.read_template.return_value = "test"
        common_mock.generate_from_template_dict.return_value = "test2"

        self.kubernetesOperator.setup_kubernetes_configfile("localhost")

        common_mock.read_template.assert_called_with(self.kubernetesOperator.kubernetes_template)
        dict_map = {
            "cluster_cfg": {"kubernetes": {"api-servers-ip": "localhost"}},
        }
        common_mock.generate_from_template_dict.assert_called_with("test", dict_map)
        common_mock.write_generated_file.assert_called_with("test2", self.kubernetesOperator.kube_config_path)

    @patch('operator_wrapper.kubernetes_operator.get_configmap')
    def test_get_nodes(self, get_configmap_mock):
        get_configmap_mock.return_value = {
            "data": {self.kubernetesOperator.configmap_data_key: "10.0.0.1\n10.0.0.2"}
        }

        nodes = self.kubernetesOperator.get_nodes()

        self.assertEqual(nodes, {"10.0.0.1", "10.0.0.2"})

    @patch('operator_wrapper.kubernetes_operator.update_configmap')
    def test_get_nodes(self, update_configmap_mock):
        nodes = {"10.0.0.3", "10.0.0.4"}
        nodes_str = "\n".join(nodes)

        self.kubernetesOperator.set_nodes(nodes)

        update_configmap_mock.assert_called_with(self.kubernetesOperator.kube_config_path,
                                                 self.kubernetesOperator.configmap_name,
                                                 {self.kubernetesOperator.configmap_data_key: nodes_str})


if __name__ == "__main__":
    unittest.main()
