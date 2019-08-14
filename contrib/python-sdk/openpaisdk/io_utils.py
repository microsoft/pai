import os
import errno
import shutil
from webbrowser import open_new_tab
from contextlib import contextmanager
import json
import yaml
from openpaisdk import __logger__, __local_default_file__, __global_default_file__, __flags__
from urllib.request import urlopen
from urllib.parse import urlparse, urlsplit
from urllib.request import urlretrieve
import cgi


__yaml_exts__ = ['.yaml', '.yml']
__json_exts__ = ['.json', '.jsn']


def get_global_defaults():
    if os.path.isfile(__global_default_file__):
        return from_file(__global_default_file__, default="==FATAL==")
    return {}


def get_per_folder_defaults():
    if os.path.isfile(__local_default_file__):
        return from_file(__local_default_file__, default="==FATAL==")
    return {}


def get_defaults(global_only: bool = False):
    dic = get_global_defaults()
    if not global_only:
        dic.update(get_per_folder_defaults())
    return dic


def update_default(key: str, value: str = None, is_global: bool = False, to_delete: bool = False):
    filename = __global_default_file__ if is_global else __local_default_file__
    dic = get_global_defaults() if is_global else get_per_folder_defaults()
    if to_delete:
        if key not in dic:
            __logger__.warn("key %s not found in %s, ignored", key, filename)
            return
        del dic[key]
    else:
        __logger__.info("key %s updated to %s in %s", key, value, filename)
        dic[key] = value
    to_file(dic, filename)


def browser_open(url: str):
    __logger__.info("open in browser: %s", url)
    try:
        open_new_tab(url)
    except Exception as e:
        __logger__.warn("failed to open %s due to %s", url, e)


def return_default_if_error(func):
    def f(*args, default="==FATAL==", **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as identifier:
            if default == "==FATAL==":
                __logger__.error('Error: %s', identifier, exc_info=True)
            __logger__.warn(
                'error occurs when reading %s (%s), return default (%s)', args, identifier, default)
            return default
    return f


@return_default_if_error
def from_json_file(fname: str, **kwargs):
    import json
    with open(fname) as fp:
        return json.load(fp, **kwargs)


@return_default_if_error
def from_yaml_file(fname: str, **kwargs):
    import yaml
    with open(fname) as fp:
        kwargs.setdefault('Loader', yaml.FullLoader)
        return yaml.load(fp, **kwargs)


def get_url_filename_from_server(url):
    try:
        blah = urlopen(url).info()['Content-Disposition']
        _, params = cgi.parse_header(blah)
        return params["filename"]
    except Exception as e:
        __logger__.warn('Failed to get filename from server: %s', e)
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
    except Exception as e:
        __logger__.error("failed to download", exc_info=True)


def from_file(fname: str, default={}, fmt: str = None, **kwargs):
    if fmt == "json" or os.path.splitext(fname)[1] in __json_exts__:
        return from_json_file(fname, default=default, **kwargs)
    if fmt == "yaml" or os.path.splitext(fname)[1] in __yaml_exts__:
        return from_yaml_file(fname, default=default, **kwargs)


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


def to_screen(s, **kwargs):
    if __flags__.disable_to_screen:
        return
    if isinstance(s, str):
        print(s, **kwargs, flush=True)
    else:
        print(yaml.dump(s, default_flow_style=False, **kwargs), flush=True)
