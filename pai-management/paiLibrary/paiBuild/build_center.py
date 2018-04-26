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



from ..common import file_handler
from ..common import directory_handler


class build_center:


    def __init__(self, cluster_object_model, build_target = None):

        self.cluster_object_model = cluster_object_model
        if build_target != None:
            self.image_list = self.get_image_list()
        else:
            self.image_list = build_target



    def get_image_list(self):

        image_list = list()

        subdir_list = directory_handler.get_subdirectory_list("src/")
        for subdir in subdir_list:

            image_conf_path =  "src/{0}/image.yaml".format(subdir)
            if file_handler.file_exist_or_not(image_conf_path):
                image_list.append(subdir)

        return image_list



    def






