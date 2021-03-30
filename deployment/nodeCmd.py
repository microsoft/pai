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

import logging

from paiLibrary.paiOrchestration import change_node


class NodeCmd():

    def __init__(self):
        self._logger = logging.getLogger(__name__)

    def register(self, parser):
        node_parser = parser.add_subparsers(help="Node operations")

        # ./paictl.py node add ...
        add_parser = node_parser.add_parser("add")
        add_parser.set_defaults(handler=self._add_node)

        # ./paictl.py node remove ...
        remove_parser = node_parser.add_parser("remove")
        remove_parser.set_defaults(handler=self._remove_node)

        def add_arguments(parser):
            parser.add_argument("-v", "--verbose", action="store_true", dest="verbose", default=False, help="Display ansible logs of skip and ok hosts")
            parser.add_argument("-c", "--kube-config-path", dest="kube_config_path", default="~/.kube/config", help="The path to KUBE_CONFIG file. Default value: ~/.kube/config")
            group = parser.add_mutually_exclusive_group()
            group.add_argument("-n", "--node-list", nargs='+', dest="node_list", default=None, help="Node list to add / remove")

        add_arguments(add_parser)
        add_arguments(remove_parser)

    def _add_node(self, args):
        change_node.ChangeNode(args.kube_config_path, args.verbose).run(mode="add", node_list=args.node_list)

    def _remove_node(self, args):
        change_node.ChangeNode(args.kube_config_path, args.verbose).run(mode="remove", node_list=args.node_list)
