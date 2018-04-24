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

import k8sClusterManagement


class TestBootstrap(unittest.TestCase):

    """
    Test the bootstrap's api
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



    # option_validation: Correct Option
    def test_option_validation_correct_option(self):

        class Object(object):
            pass

        args = Object()

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -a deploy
        # Target: True
        args.path = "testpath"
        args.action = "deploy"
        args.file = None
        self.assertTrue(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -a clean
        # Target: True
        args.path = "testpath"
        args.action = "clean"
        args.file = None
        self.assertTrue(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -a install_kubectl
        # Target: True
        args.path = "testpath"
        args.action = "install_kubectl"
        args.file = None
        self.assertTrue(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a add
        # Target: True
        args.path = "testpath"
        args.action = "add"
        args.file = "testfile"
        self.assertTrue(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a remove
        # Target: True
        args.path = "testpath"
        args.action = "remove"
        args.file = "testfile"
        self.assertTrue(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a repair
        # Target: True
        args.path = "testpath"
        args.action = "repair"
        args.file = "testfile"
        self.assertTrue(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a etcdfix
        # Target: True
        args.path = "testpath"
        args.action = "etcdfix"
        args.file = "testfile"
        self.assertTrue(k8sClusterManagement.option_validation(args))



    # option_validation: Missing option
    def test_option_validation_missing_option(self):

        class Object(object):
            pass

        args = Object()

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -a add
        # Target: False
        args.path = "testpath"
        args.action = "add"
        args.file = None
        self.assertFalse(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -a remove
        # Target: False
        args.path = "testpath"
        args.action = "remove"
        args.file = None
        self.assertFalse(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -a repair
        # Target: False
        args.path = "testpath"
        args.action = "repair"
        args.file = None
        self.assertFalse(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -a etcdfix
        # Target: False
        args.path = "testpath"
        args.action = "etcdfix"
        args.file = None
        self.assertFalse(k8sClusterManagement.option_validation(args))




    # option_validation: Wrong comination
    def test_option_validation_wrong_combination(self):

        class Object(object):
            pass

        args = Object()

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a deploy
        # Target: False
        args.path = "testpath"
        args.action = "deploy"
        args.file = "testfile"
        self.assertFalse(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a clean
        # Target: False
        args.path = "testpath"
        args.action = "clean"
        args.file = "testfile"
        self.assertFalse(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a install_kubectl
        # Target: False
        args.path = "testpath"
        args.action = "install_kubectl"
        args.file = "testfile"
        self.assertFalse(k8sClusterManagement.option_validation(args))



    # option_validation: Non-existent option
    def test_option_validation_non_existent_option(self):

        class Object(object):
            pass

        args = Object()

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -f yournodelist.yaml -a false
        # Target: False
        args.path = "testpath"
        args.action = "false"
        args.file = "testfile"
        self.assertFalse(k8sClusterManagement.option_validation(args))

        # sudo ./bootstrap.py -p yourclusterconfig.yaml -a false
        # Target: False
        args.path = "testpath"
        args.action = "false"
        args.file = None
        self.assertFalse(k8sClusterManagement.option_validation(args))





if __name__ == '__main__':
    unittest.main()

