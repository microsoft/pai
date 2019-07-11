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
import os
import json
import sys

from base_operator import BaseOperator

logger = logging.getLogger(__name__)


class RestserverOperator(BaseOperator):

    secret_file = ".restserver/user_info"

    def __init__(self, restserver_ip, restserver_port=9186):
        super(RestserverOperator, self).__init__(restserver_ip, restserver_port)
        self.token = ""
        self.load_token()

    @classmethod
    def setup_user(cls, username, password):
        if not os.path.exists(os.path.dirname(cls.secret_file)):
            os.mkdir(os.path.dirname(cls.secret_file))
        with open(cls.secret_file, "w") as f:
            data = {
                "username": username,
                "password": password
            }
            json.dump(data, f)

    def load_token(self):
        if not os.path.exists(self.secret_file):
            return
        with open(self.secret_file) as f:
            data = json.load(f)
        api_path = "/api/v1/token"
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        response = self.request(api_path, method="post", headers=headers, data=data)
        self.token = response["token"]

    def get_vc(self):
        api_path = "/api/v1/virtual-clusters"
        response = self.request(api_path)
        return response

    def add_vc(self, name, capacity=0, maxcapacity=0):
        if self.token == "":
            logger.error("Anonymous user can't add vc, please setup user firstly")
            sys.exit(1)
        api_path = "/api/v1/virtual-clusters/{}".format(name)
        headers = {
            "Authorization": "Bearer " + self.token
        }
        data = {
            "vcCapacity": capacity,
            "vcMaxCapacity": maxcapacity
        }
        response = self.request(api_path, method="put", headers=headers, data=data)
        return response

    def delete_vc(self, name):
        if self.token == "":
            logger.error("Anonymous user can't delete vc, please setup user firstly")
            sys.exit(1)
        api_path = "/api/v1/virtual-clusters/{}".format(name)
        headers = {
            "Authorization": "Bearer " + self.token
        }
        response = self.request(api_path, method="delete", headers=headers)
        return response

    def delete_group(self, name):
        if self.token == "":
            logger.error("Anonymous user can't delete group, please setup user firstly")
            sys.exit(1)
        api_path = "/api/v2/group/{}".format(name)
        headers = {
            "Authorization": "Bearer " + self.token
        }
        response = self.request(api_path, method="delete", headers=headers)
        return response


if __name__ == '__main__':
    pass






