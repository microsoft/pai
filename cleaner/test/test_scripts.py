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
import mock
import subprocess
import logging
from cleaner.scripts.common import run_cmd


class TestCommon(unittest.TestCase):

    @unittest.patch(subprocess)
    def testRunCmd(self, patched_subprocess):
        mock_stdout = mock.Mock()
        mock_stdout.readline = mock.Mock()
        mock_stdout.readline.side_effect = ["test", None]

        mock_proc = mock.Mock()
        mock_proc.stdout = mock.Mock(return_value=mock_stdout)
        mock_proc.wait = mock.Mock()
        mock_proc.returncode = mock.Mock(return_value=0)

        patched_subprocess.Popen = mock.Mock(return_value=mock_proc)

        logger = logging.getLogger("test")
        run_cmd("pwd", logger)
        self.assertTrue(mock_stdout.readline.call_count == 2)


if __name__ == "__main__":
    unittest.main()
