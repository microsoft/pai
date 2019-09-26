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
import errno
import shutil
from webbrowser import open_new_tab
from contextlib import contextmanager
from functools import partial
import json
import yaml
import logging
from urllib.request import urlopen
from urllib.parse import urlsplit
from urllib.request import urlretrieve
import cgi
from openpaisdk.flags import __flags__

logging.basicConfig(format='%(name)s - %(levelname)s - %(message)s')
__logger__ = logging.getLogger(name="openpai")
__logger__.setLevel(level=logging.DEBUG if __flags__.debug_mode else logging.INFO)


def to_screen(msg, _type: str = "normal", **kwargs):
    """a general wrapping function to deal with interactive IO and logging
    """
    def print_out(msg, **kwargs):
        out = yaml.dump(msg, default_flow_style=False, **kwargs) if not isinstance(msg, str) else msg
        if not __flags__.disable_to_screen:
            print(out, flush=True)
        return out

    def print_table(msg, **kwargs):
        from tabulate import tabulate
        out = tabulate(msg, **kwargs)
        if not __flags__.disable_to_screen:
            print(out, flush=True)
        return out

    func_dict = {
        "normal": print_out,
        "table": print_table,
        "warn": partial(__logger__.warn, exc_info=__flags__.debug_mode),
        "debug": __logger__.debug,
        "error": partial(__logger__.error, exc_info=True),
    }
    assert _type in func_dict, f"unsupported output type {_type}, only {list(func_dict.keys(()))} are valid"
    ret = func_dict[_type](msg, **kwargs)
    return ret if _type == "table" else msg


def listdir(path):
    assert os.path.isdir(path), "{} is not a valid path of directory".format(path)
    root, dirs, files = next(os.walk(path))
    return {
        "root": root,
        "dirs": dirs,
        "files": files
    }


def browser_open(url: str):
    __logger__.info("open in browser: %s", url)
    try:
        open_new_tab(url)
    except Exception as e:
        to_screen(f"fail to open {url} due to {repx(e)}", _type="warn")


def from_file(fname: str, default=None, silent: bool = False, **kwargs):
    """read yaml or json file; return default if (only when default is not None)
    - file non existing
    - empty file or contents in file is not valid
    - loaded content is not expected type (type(default))
    """
    import yaml
    assert os.path.splitext(fname)[1] in __json_exts__ + __yaml_exts__, f"unrecognized {fname}"
    try:
        with open(fname) as fp:
            dic = dict(kwargs)
            dic.setdefault('Loader', yaml.FullLoader)
            ret = yaml.load(fp, **dic)
            assert ret, f"read empty object ({ret}) from {fname}, return {default}"
            assert default is None or isinstance(
                ret, type(default)), f"read wrong type ({type(ret)}, expected {type(default)}) from {fname}, return {default}"
            return ret
    except Exception as identifier:
        if default is None:
            to_screen(f"{repr(identifier)} when reading {fname}", _type="error")
            raise identifier
        if not silent:
            to_screen(f"{repr(identifier)} when reading {fname}", _type="warn")
        return default


def get_url_filename_from_server(url):
    try:
        blah = urlopen(url).info()['Content-Disposition']
        _, params = cgi.parse_header(blah)
        return params["filename"]
    except Exception as e:
        to_screen(f'Failed to get filename from server: {repr(e)}', _type="warn")
        return None


def web_download_to_folder(url: str, folder: str, filename: str = None):
    if not filename:
        split = urlsplit(url)
        filename = split.path.split("/")[-1]
    filename = os.path.join(folder, filename)
    os.makedirs(folder, exist_ok=True)
    try:
        urlretrieve(url, filename)
        __logger__.info('download from %s to %s', url, filename)
        return filename
    except Exception:
        __logger__.error("failed to download", exc_info=True)


def mkdir_for(pth: str):
    d = os.path.dirname(pth)
    if d:
        os.makedirs(d, exist_ok=True)
    return d


def file_func(kwargs: dict, func=shutil.copy2, tester: str = 'dst'):
    try:
        return func(**kwargs)
    except IOError as identifier:
        # ENOENT(2): file does not exist, raised also on missing dest parent dir
        if identifier.errno != errno.ENOENT:
            print(identifier.__dict__)
        assert tester in kwargs.keys(), 'wrong parameter {}'.format(tester)
        os.makedirs(os.path.dirname(kwargs[tester]), exist_ok=True)
        return func(**kwargs)
    except Exception as identifier:
        print(identifier)
        return None


@contextmanager
def safe_open(filename: str, mode: str = 'r', func=open, **kwargs):
    "if directory of filename does not exist, create it first"
    mkdir_for(filename)
    fn = func(filename, mode=mode, **kwargs)
    yield fn
    fn.close()


@contextmanager
def safe_chdir(pth: str):
    "safely change directory to pth, and then go back"
    currdir = os.getcwd()
    try:
        if not pth:
            pth = currdir
        os.chdir(pth)
        __logger__.info("changing directory to %s", pth)
        yield pth
    finally:
        os.chdir(currdir)
        __logger__.info("changing directory back to %s", currdir)


def safe_copy(src: str, dst: str):
    "if directory of filename doesnot exist, create it first"
    return file_func({'src': src, 'dst': dst})


__yaml_exts__, __json_exts__ = ['.yaml', '.yml'], ['.json', '.jsn']


def to_file(obj, fname: str, fmt=None, **kwargs):
    if not fmt:
        _, ext = os.path.splitext(fname)
        if ext in __json_exts__:
            fmt, dic = json, dict(indent=4)
        elif ext in __yaml_exts__:
            import yaml
            fmt, dic = yaml, dict(default_flow_style=False)
        else:
            raise NotImplementedError
        dic.update(kwargs)
    else:
        dic = kwargs
    with safe_open(fname, 'w') as fp:
        fmt.dump(obj, fp, **dic)
        __logger__.debug("serialize object to file %s", fname)
