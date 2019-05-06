import os
import errno
import shutil
import fnmatch
from contextlib import contextmanager
import json
from openpaisdk import __logger__

__yaml_exts__ = ['.yaml', '.yml']
__json_exts__ = ['.json', '.jsn']


def from_file(fname: str, default={}, fmt=None):
    try:
        if not fmt:
            _, ext = os.path.splitext(fname)
            if ext in __json_exts__:
                fmt = json
            elif ext in __yaml_exts__:
                import yaml
                fmt = yaml
            else:
                __logger__.error('unrecognized file extension %s', ext, exc_info=True)
        with open(fname) as fn:
            __logger__.debug('Deserializing from %s', fname)
            return fmt.load(fn)
    except Exception as e:
        if default == '==FATAL==':
            __logger__.error('IO Err: %s', e, exc_info=True)
        __logger__.debug('Deserializing failed, return default')
        return default 


def file_func(kwargs: dict, func=shutil.copy2, tester: str='dst'):
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
def safe_open(filename: str, mode: str='r', **kwargs):
    "if directory of filename doesnot exist, create it first"
    args = dict(kwargs)
    args.update({'file':filename, 'mode':mode})
    fn = file_func(args, func=open, tester='file')
    yield fn
    fn.close()


@contextmanager
def safe_chdir(pth:str):
    "safely change directory to pth, and then go back"
    currdir = os.getcwd()
    try:
        os.chdir(pth)
        yield pth
    finally:
        os.chdir(currdir)


def safe_copy(src: str, dst: str):
    "if directory of filename doesnot exist, create it first"
    return file_func({'src':src, 'dst':dst})


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