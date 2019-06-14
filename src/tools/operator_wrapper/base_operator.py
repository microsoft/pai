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
import requests
import subprocess

logger = logging.getLogger(__name__)


class BaseOperator(object):
    def __init__(self, master_ip, port):
        self.master_ip = master_ip
        self.port = port

    def request(self, api_path, method="get", return_json=True, timeout=10,  **kwargs):

        url = "http://{}:{}{}".format(self.master_ip, self.port, api_path)

        logger.debug("{}: {}".format(method, url))
        func = getattr(requests, method)
        response = func(url, timeout=timeout, **kwargs)
        response.raise_for_status()
        if return_json:
            return response.json()
        else:
            return response.text

    def execute(self, command, redirect_stderr=True, shell=True, **kwargs):
        logger.debug(command)
        stderr = subprocess.STDOUT if redirect_stderr else None
        output = subprocess.check_output(command, stderr=stderr, shell=shell, **kwargs)
        try:
            output = output.decode("utf8")
        except AttributeError:
            pass
        return output


if __name__ == "__main__":
    pass

