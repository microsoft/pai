"""
common functions to
"""
import importlib
import os
import time
from typing import Union
from copy import deepcopy
from functools import wraps
from collections import Iterable
from requests import Response, request
from requests_toolbelt.utils import dump

import subprocess
from openpaisdk import __logger__
from openpaisdk.io_utils import safe_chdir, to_screen


def exception_free(err_type, default):
    "return the default value if the exception is caught"
    def inner_func(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except err_type as e:
                to_screen(str(e), is_warn=True)
                return default
            except Exception as e:
                raise e
        return wrapper
    return inner_func


def concurrent_map(fn, it, max_workers=None):
    "a wrapper of concurrent.futures.ThreadPoolExecutor.map, retrieve the results"
    from concurrent.futures import ThreadPoolExecutor
    ret = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = executor.map(fn, it)
        for f in futures:
            ret.append(f)
    return ret


class OrganizedList:

    @staticmethod
    def filter(lst: iter, key: str = None, target=None, getter=dict.get):
        m = [(i, x) for i, x in enumerate(lst) if getter(x, key) == target]
        return {
            "matches": [x[1] for x in m],
            "indexes": [x[0] for x in m],
        }

    @staticmethod
    def as_dict(lst: list, key: str, getter=dict.get):
        return {getter(x, key): x for x in lst}

    @staticmethod
    def add(lst: list, key: str, elem: dict, getter=dict.get, silent: bool = False) -> bool:
        "return True if update an existing elements, else return False"
        target = getter(elem, key)
        m = OrganizedList.filter(lst, key, target)  # type: dict, matches
        for x in m["matches"]:
            x.update(elem)
            if not silent:
                to_screen("%s = %s already exists, update it" % (key, elem[key]))
            return lst
        lst.append(elem)
        if not silent:
            to_screen("%s = %s added" % (key, elem[key]))
        return lst

    @staticmethod
    def delete(lst: list, key: str, target, getter=dict.get) -> list:
        indexes = OrganizedList.filter(lst, key, target, getter)["indexes"]
        if not indexes:
            __logger__.warn(
                "element with %s = %s cannot be deleted due to non-existence", key, target)
            return False
        for index in sorted(indexes, reverse=True):
            del lst[index]
        return True


class Nested:

    def __init__(self, t, sep: str = ":"):
        self.__sep__ = sep
        self.content = t

    def get(self, keys: str):
        return Nested.s_get(self.content, keys.split(self.__sep__))

    def set(self, keys: str, value):
        return Nested.s_set(self.content, keys.split(self.__sep__), value)

    @staticmethod
    def _validate(context: Union[list, dict], idx: Union[str, int]):
        return int(idx) if isinstance(context, list) else idx

    @staticmethod
    def s_get(target, keys: list):
        k = Nested._validate(target, keys[0])
        if len(keys) == 1:
            return target[k]
        return Nested.s_get(target[k], keys[1:])

    @staticmethod
    def s_set(target, keys: list, value):
        # ! not allow to create a list
        k = Nested._validate(target, keys[0])
        if len(keys) == 1:
            target[k] = value
            return
        if isinstance(target, dict) and k not in target:
            target[k] = dict()
        return Nested.s_set(target[k], keys[1:], value)


def getobj(name: str):
    mod_name, func_name = name.rsplit('.', 1)
    mod = importlib.import_module(mod_name)
    return getattr(mod, func_name)


class RestSrvError(Exception):
    "Error type for Rest server not response as expected"

    pass


class NotReadyError(Exception):
    pass


class Retry:

    def __init__(self, max_try: int = 10, t_sleep: float = 10, timeout: float = 600, silent: bool = True):
        self.max_try = max_try
        self.t_sleep = t_sleep
        self.timeout = timeout
        if self.timeout:
            assert self.t_sleep, "must specify a period to sleep if timeout is set"
        self.silent = silent

    def retry(self, f_exit, func, *args, **kwargs):
        t, i = 0, 0
        while True:
            try:
                x = func(*args, **kwargs)
                if f_exit(x):
                    if not self.silent:
                        to_screen("ready: {}".format(x))
                    return x
            except NotReadyError as identifier:
                __logger__.debug("condition not satisfied", identifier)
            if not self.silent:
                to_screen("not ready yet: {}".format(x))
            i, t = i + 1, t + self.t_sleep
            if self.max_try and i >= self.max_try or self.timeout and t >= self.timeout:
                return None
            if self.t_sleep:
                time.sleep(self.t_sleep)


def get_response(method: str, path: Union[list, str], headers: dict = None, body: dict = None, allowed_status: list = [200], **kwargs):
    """an easy wrapper of request, including:
    - path accept a list of strings and more complicated input
        - ['aaa', 'bbb', 'ccc'] -> 'aaa/bbb/ccc'
        - ['aaa', 'bbb', ('xxx', None), 'ddd'] -> 'aaa/bbb/ccc'
        - ['aaa', 'bbb', ('xxx', 'x-val'), 'ddd'] -> 'aaa/bbb/xxx/x-val/ccc'
    - will checked the response status_code, raise RestSrvError if not in the allowed_status
    """
    def path_join(path):
        def is_single_element(x):
            return isinstance(x, str) or not isinstance(x, Iterable)
        if is_single_element(path):
            return str(path)
        p_lst = []
        for p in path:
            if not p:
                continue
            if is_single_element(p):
                p_lst.append(str(p))
            elif all(p):
                p_lst.extend([str(x) for x in p])
        return '/'.join(p_lst)

    path = path_join(path)
    headers = na(headers, {})
    body = na(body, {})
    application_json = 'Content-Type' not in headers or headers['Content-Type'] == 'application/json'
    response = request(method, path, headers=headers, **kwargs, **{
        "json" if application_json else "data": body
    })
    __logger__.debug('----------Response-------------\n%s', dump.dump_all(response).decode('utf-8'))
    if allowed_status and response.status_code not in allowed_status:
        __logger__.warn(response.status_code, response.json())
        raise RestSrvError(response.status_code, response.json())
    return response


def run_command(commands,  # type: Union[list, str]
                cwd=None,  # type: str
                ):
    command = commands if isinstance(commands, str) else " ".join(commands)
    with safe_chdir(cwd):
        rtn_code = os.system(command)
        if rtn_code:
            raise subprocess.CalledProcessError(rtn_code, commands)


def find(fmt: str, s: str, g: int = 1, func=None):
    import re
    func = na(func, re.match)
    m = func(fmt, s)
    return m.group(g) if m else None


def na(a, default):
    return a if a is not None else default


def na_lazy(a, fn, *args, **kwargs):
    return a if a is not None else fn(*args, **kwargs)


def flatten(lst: list):
    return sum(lst, [])
