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


import fs
from fs.base import FS
from fs.enums import ResourceType
from fs.info import Info
from fs.path import forcedir, frombase, dirname, basename
from fs.permissions import Permissions
from fs.subfs import SubFS
from fs.opener import Opener
from functools import wraps
from contextlib import contextmanager


def expand_root(s, path):
    if not hasattr(s, 'root_path'):
        return path
    return fs.path.join(s.root_path, path)


def combine_root(func):
    @wraps(func)
    def inner(s, path, *args, **kwargs):
        if hasattr(s, 'expand_root'):
            path = expand_root(s, path)
        return func(s, path, *args, **kwargs)
    return inner


class WEBHDFS(FS):
    _meta = {
        'case_insensitive': False,
        'invalid_path_chars': [':', '\0'],
        'max_path_length': 8000,
        'max_sys_path_length': None,
        'network': True,
        'read_only': False,
        'support_rename': True,
        'unicode_paths': True
    }

    def __init__(self, url, user=None, kerberos=False, token=None, root_path='/'):
        import hdfs
        super().__init__()
        if not url.startswith("http"):
            url = f"http://{url}"
        self.root_path = root_path
        if kerberos:
            self.fs = hdfs.ext.kerberos.KerberosClient(url)
        elif token:
            self.fs = hdfs.TokenClient(url, token)
        else:
            self.fs = hdfs.InsecureClient(url, user)

    @combine_root
    def getinfo(self, path, namespaces=None):
        from hdfs import HdfsError
        try:
            res = self.fs.status(path)
        except HdfsError as e:
            raise fs.errors.ResourceNotFound(path)
        if res['type'] == 'FILE':
            rt = ResourceType.file
        elif res['type'] == 'DIRECTORY':
            rt = ResourceType.directory
        else:
            rt = ResourceType.unknown

        return Info({
            'basic': {
                'name': basename(path),
                'is_dir': res['type'] == 'DIRECTORY'
            },
            'details': {
                'size': res['length'],
                'modified': res['modificationTime'],
                'accessed': res['accessTime'],
                'type': rt
            },
            'access': {
                'user': res['owner'],
                'group': res['group'],
                'permissions': res['permission']
            }
        })

    @combine_root
    def listdir(self, path):
        return self.fs.list(forcedir(path))

    @combine_root
    def makedir(self, path, permissions=None, recreate=False):
        assert not recreate, "not support recreate, please cre"
        self.fs.makedirs(path, permissions and oct(permissions.mode))
        return SubFS(self, path)

    def makedirs(self, path, permissions=None, recreate=False):
        return self.makedir(path, permissions, recreate)

    @combine_root
    def remove(self, path):
        self.fs.delete(path)

    def removedir(self, path):
        try:
            self.fs.delete(path)
        except Exception as e:
            raise fs.errors.DirectoryNotEmpty(path, msg=e)

    @contextmanager
    @combine_root
    def openbin(self, path, mode: str = "rb", buffering: int = -1, **options):
        allowed_modes = ['rb', 'wb']
        assert mode in allowed_modes, "only support " + '/'.join(allowed_modes)
        if mode in ["r", "rb"]:
            with self.fs.read(path, **options) as fn:
                yield fn
        elif mode == "wb":
            with self.fs.write(path, **options) as fn:
                yield fn
        # raise NotImplementedError

    def setinfo(self):
        raise NotImplementedError


# host = "http://10.151.40.234/webhdfs"
# filepath = "/code/jobs/jupyter_102181nz/source/jupyter_102181nz.tar.gz"
# dirpath = "/openpai-sdk/test-fs/fs-hdfs"

# f1 = WEBHDFS(host)
# print(f1.makedirs(dirpath))
# print(f1.listdir(dirpath))
# print(f1.remove(filepath))
# print(f1.getinfo(filepath))
