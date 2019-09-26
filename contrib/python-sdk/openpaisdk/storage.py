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


"""
[summary]
"""
from openpaisdk.io_utils import mkdir_for, to_screen


class Storage:

    def __init__(self, protocol: str = 'webHDFS', *args, **kwargs):
        self.protocol, self.client = protocol.lower(), None
        if protocol.lower() == 'webHDFS'.lower():
            from hdfs import InsecureClient
            self.client = InsecureClient(*args, **kwargs)
            for f in 'upload download list status delete'.split():
                setattr(self, f, getattr(self, '%s_%s' %
                                         (f, protocol.lower())))

    def upload_webhdfs(self, local_path: str, remote_path: str, **kwargs):
        to_screen("upload %s -> %s" % (local_path, remote_path))
        return self.client.upload(local_path=local_path, hdfs_path=remote_path, **kwargs)

    def download_webhdfs(self, remote_path: str, local_path: str, **kwargs):
        mkdir_for(local_path)
        to_screen("download %s -> %s" % (remote_path, local_path))
        return self.client.download(local_path=local_path, hdfs_path=remote_path, overwrite=True, **kwargs)

    def list_webhdfs(self, remote_path: str, **kwargs):
        return self.client.list(hdfs_path=remote_path, **kwargs)

    def status_webhdfs(self, remote_path: str, **kwargs):
        return self.client.status(hdfs_path=remote_path, **kwargs)

    def delete_webhdfs(self, remote_path: str, **kwargs):
        return self.client.delete(hdfs_path=remote_path, **kwargs)
