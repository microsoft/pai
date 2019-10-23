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
common functions to
"""
from openpaisdk.io_utils import safe_chdir, to_screen, __logger__
import subprocess
import importlib
import os
import time
import requests
from typing import Union
from functools import wraps
from collections import Iterable
from requests_toolbelt.utils import dump
from urllib3.exceptions import InsecureRequestWarning

# Suppress only the single warning from urllib3 needed.
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)


def exception_free(err_type, default, err_msg: str = None):
    "return the default value if the exception is caught"
    def inner_func(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except err_type as e:
                if not err_msg:
                    to_screen(repr(e), _type="warn")
                else:
                    to_screen(err_msg, _type="warn")
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


class OrganizedList(list):

    def __init__(self, lst: list, _key: str = None, _getter=dict.get):
        super().__init__(lst)
        self._getter = _getter
        self._key = _key

    @property
    def _fn_get(self):
        return lambda elem: self._getter(elem, self._key)

    def first_index(self, target):
        for i, elem in enumerate(self):
            if self._fn_get(elem) == target:
                return i
        return None

    def first(self, target):
        i = self.first_index(target)
        return self[i] if i is not None else None

    def filter_index(self, target=None, include: list = None, exclude: list = None):
        if include is not None:
            return [i for i, elem in enumerate(self) if self._fn_get(elem) in include]
        if exclude is not None:
            return [i for i, elem in enumerate(self) if self._fn_get(elem) not in exclude]
        return [i for i, elem in enumerate(self) if self._fn_get(elem) == target]

    def filter(self, target=None, include=None, exclude=None):
        return OrganizedList([self[i] for i in self.filter_index(target, include, exclude)], self._key, self._getter)

    @property
    def as_dict(self):
        return {self._fn_get(elem): elem for elem in self}

    @property
    def as_list(self):
        return [x for x in self]

    def add(self, elem: dict, getter=dict.get, silent: bool = False, replace: bool = False):
        for i in self.filter_index(self._fn_get(elem)):
            if replace:
                self[i] = elem
                if not silent:
                    to_screen(f"OrganizedList: {self._key} = {self._fn_get(elem)} already exists, replace it")
            else:
                self[i].update(elem)
                if not silent:
                    to_screen(f"OrderedDict: {self._key} = {self._fn_get(elem)} already exists, update it")
            return self  # ~ return
        self.append(elem)
        if not silent:
            to_screen(f"OrganizedList: {self._key} = {self._fn_get(elem)} added")
        return self

    def remove(self, target):
        indexes = self.filter_index(target)
        if not indexes:
            to_screen(f"OrganizedList: {self._key} = {target} cannot be deleted due to non-existence")
            return self
        for index in sorted(indexes, reverse=True):
            del self[index]
            to_screen(f"OrganizedList: {self._key} = {target} removed")
        return self


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


def path_join(path: Union[list, str], sep: str = '/'):
    """ join path from list or str
    - ['aaa', 'bbb', 'ccc'] -> 'aaa/bbb/ccc'
    - ['aaa', 'bbb', ('xxx', None), 'ddd'] -> 'aaa/bbb/ccc'
    - ['aaa', 'bbb', ('xxx', 'x-val'), 'ddd'] -> 'aaa/bbb/xxx/x-val/ccc'
    """
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


def get_response(method: str, path: Union[list, str], headers: dict = None, body: dict = None, allowed_status: list = [200], **kwargs):
    """an easy wrapper of request, including:
    - path accept a list of strings and more complicated input
    - will checked the response status_code, raise RestSrvError if not in the allowed_status
    """
    path = path_join(path)
    headers = na(headers, {})
    body = na(body, {})
    application_json = 'Content-Type' not in headers or headers['Content-Type'] == 'application/json'
    response = requests.request(method, path, headers=headers, ** kwargs, **{
        "json" if application_json else "data": body,
        "verify": False,  # support https
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


def sys_call(args, dec_mode: str = 'utf-8'):
    p = subprocess.Popen(args, shell=True, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    out, err = p.communicate()
    if dec_mode:
        out, err = out.decode(dec_mode), err.decode(dec_mode)
    if p.returncode:
        raise subprocess.CalledProcessError(f"ErrCode: {p.returncode}, {err}")
    return out, err


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


def randstr(num: int = 10, letters=None):
    "get a random string with given length"
    import string
    import random
    letters = na(letters, string.ascii_letters)
    return ''.join(random.choice(letters) for i in range(num))
