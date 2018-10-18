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


import os
import logging
import logging.config
#
from . import linux_shell


logger = logging.getLogger(__name__)


def get_subdirectory_list(path):

    return next(os.walk(path))[1]



def directory_create(path):

    if os.path.exists(path) == False:
        shell_cmd = "mkdir -p {0}".format(path)
        error_msg = "failed to mkdir -p {0}".format(path)
        linux_shell.execute_shell(shell_cmd, error_msg)



def directory_copy(src_item, dst):

    directory_create(dst)

    shell_cmd = "cp -r {0} {1}".format(src_item, dst)
    error_msg = "failed to copy {0}".format(src_item)
    linux_shell.execute_shell(shell_cmd, error_msg)



def directory_delete(path):

    shell_cmd = "rm -rf {0}".format(path)
    error_msg = "failed to delete {0}".format(path)
    linux_shell.execute_shell(shell_cmd, error_msg)



def directory_exist_or_not(path):

    return os.path.isfile(path) != True and os.path.exists(path) == True








