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

from ...paiLibrary.common import directory_handler
from ...paiLibrary.common import file_handler
from ...paiLibrary.common import linux_shell


class local_storage:

    def __init__(self, storage_configuration):
        self.conf_path = storage_configuration["path"]



    def copy_file(self, src_prefix, dst_prefix):

        file_list = file_handler.get_file_list_in_path(src_prefix)
        dir_list = directory_handler.get_subdirectory_list(src_prefix)

        directory_handler.directory_create(dst_prefix)
        for sub_dir in dir_list:
            self.copy_file(src_prefix + "/" + sub_dir, dst_prefix + "/" + sub_dir)







    def get_conf(self, path = "/tmp/pai-conf-temp/"):









