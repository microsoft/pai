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
from functools import partial, wraps
import fs
import os


class PathChecker:
    exception_type = Exception
    error_msg = "{}"

    def __init__(self, index: int = 0, lazy: bool = False):
        "specify which arguments is path, ignoring self"
        self.index = index+1
        self.lazy = lazy

    def __call__(self, func, *args, **kwargs):
        @wraps(func)
        def operation(*args, **kwargs):
            obj, path = args[0], args[self.index]
            args[0].validatepath(path)
            if not self.lazy and not self.check(obj, path):
                raise self.exception_type(self.error_msg.format(path))
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if self.lazy and not self.check(obj, path):
                    raise self.exception_type(self.error_msg.format(path))
                raise e
        return operation

    def check(self, obj, path):
        return True


class MustBeDir(PathChecker):
    exception_type = fs.errors.DirectoryExpected

    def check(self, obj, path):
        return obj.isdir(path)


class MustBeFile(PathChecker):
    exception_type = fs.errors.FileExpected

    def check(self, obj, path):
        return obj.isfile(path)


class CannotBeRoot(PathChecker):
    exception_type = fs.errors.RemoveRootError

    def check(self, obj, path):
        return not (path == "/")


class IgnoreError:

    def __init__(self, error=fs.errors.DirectoryExists):
        self.error = error

    def __call__(self, func, *args, **kwargs):
        @wraps(func)
        def operation(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except self.error:
                return args[0]
            except Exception as e:
                raise e
        return operation


def safe_fs_factory(cls):
    from functools import reduce
    from openpaisdk.fs_pai import expand_root
    if getattr(cls, "is_safe", False):
        return cls
    decorators = {
        "getinfo": [PathChecker()],
        "listdir": [MustBeDir(lazy=True)],
        "makedir": [CannotBeRoot(), IgnoreError(fs.errors.DirectoryExists)],
        "remove": [CannotBeRoot()],
        "removedir": [CannotBeRoot()],
    }
    for name, dec in decorators.items():
        func = getattr(cls, name)
        func_d = reduce(lambda x, f: f(x), [func] + dec)
        setattr(cls, name, func_d)
    setattr(cls, "is_safe", True)
    if not hasattr(cls, "expand_root"):
        setattr(cls, "expand_root", expand_root)
    return cls


def pai_open_fs(path: str):
    "path must be pai://... or a local path"
    from fs import open_fs
    from fs.opener.parse import parse_fs_url
    from fs.opener.errors import ParseError
    from fs.subfs import SubFS
    from openpaisdk.utils import OrganizedList, force_uri
    from openpaisdk.cluster import ClusterList
    def expand_pai_user(pth: str):
        user = cluster['user']
        if user:
            pth = pth.replace('${PAI_USER_NAME}', user)
        return pth

    try:
        ret = parse_fs_url(path)
        assert ret.protocol == 'pai', "only support pai://... or local path"
        alias, _, src = ret.resource.partition('/')
        storage_alias, _, pth = src.partition('/')
        storage, cluster = ClusterList().load().select_storage(alias, storage_alias)
        assert storage and cluster, f"failed to fetch info for {alias} and {storage_alias}"
        pth = expand_pai_user(pth)
        if storage['type'] == 'hdfs':
            from openpaisdk.fs_pai import WEBHDFS
            token = storage.get('extension', {}).get('token', None)
            print(storage)
            f = WEBHDFS(storage["data"]["webhdfs"], storage.get('user', cluster['user']), token=token)
        elif storage['type'] == 'nfs':
            from platform import platform
            from fs.osfs import OSFS
            plt = platform()
            if plt.startswith("Windows"):
                # from openpaisdk.win_cmds import open_mount_server_win
                # drv = open_mount_server_win(storage['data'])
                f = OSFS(os.path.normpath(expand_pai_user(
                    "//{address}{rootPath}".format(**storage["data"])
                )))
            else:
                raise NotImplementedError(f"{storage['type']} not supported over {plt} yet")

        else:
            to_screen(f"failed to parse storage {cluster}", "error")
    except ParseError:
        # ! assert path is a local path
        d, pth = os.path.split(os.path.abspath(os.path.expanduser(path)))
        f = open_fs(d)
    except Exception as e:
        raise Exception(e)
    finally:
        safe_fs_factory(type(f))
        return f, pth
