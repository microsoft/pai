"""
common functions to
"""
import importlib
import os
from typing import Union
from copy import deepcopy
from requests import Response, request
from requests_toolbelt.utils import dump

import subprocess
from openpaisdk import __logger__
from openpaisdk.io_utils import safe_chdir


class OrganizedList:

    @staticmethod
    def filter(lst: iter, key: str=None, target=None, getter=dict.get):
        m = [(i, x) for i, x in enumerate(lst) if getter(x, key) == target]
        return {
            "matches": [x[1] for x in m],
            "indexes": [x[0] for x in m],
        }

    @staticmethod
    def as_dict(lst: list, key: str, getter=dict.get):
        return {getter(x, key):x for x in lst}

    @staticmethod
    def add(lst: list, key: str, elem: dict, getter=dict.get) -> bool:
        "return True if update an existing elements, else return False"
        target = getter(elem, key)
        m = OrganizedList.filter(lst, key, target) # type: dict, matches
        updated = False
        for x in m["matches"]:
            x.update(elem)
            updated = True
        if not updated:
            lst.append(elem)
        return updated

    @staticmethod
    def notified_add(lst: list, key: str, elem: dict, getter=dict.get) -> str:
        if OrganizedList.add(lst, key, elem, getter):
            return "%s = %s already exists, update it" % (key, elem[key])
        else:
            return "%s = %s added" % (key, elem[key])

    @staticmethod
    def delete(lst: list, key: str, target, getter=dict.get) -> list:
        indexes = OrganizedList.filter(lst, key, target, getter)["indexes"]
        if not indexes:
            __logger__.warn("element with %s = %s cannot be deleted due to non-existence", key, target)
            return False
        for index in sorted(indexes, reverse=True):
            del lst[index]
        return True


class Nested:

    def __init__(self, t, sep: str=":"):
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
    mod_name, func_name = name.rsplit('.',1)
    mod = importlib.import_module(mod_name)
    return getattr(mod, func_name)


def get_response(
    path: str,
    headers: dict = {'Content-Type': 'application/json'},
    body: dict = dict(),
    method: str = 'POST',
    allowed_status=[200],  # type: list[int]
    max_try: int=1) -> Response:
    """
    Send request to REST server and get the response.

    Args:
        path (str): REST server path
        headers (dict, optional): Defaults to {'Content-Type': 'application/json'}. request headers
        body (dict, optional): Defaults to dict(). data body of the request (default is json format)
        method (str, optional): Defaults to 'POST'. POST / PUT / GET
        allowed_status (list, optional): Defaults to [200]. raise exception if the status_code of response not in the list

    Returns:
        [Response]: request response
    """
    num, successful = 0, False
    # deal with body format
    dic = dict(headers=headers)
    if headers.get('Content-Type', 'application/json'):
        dic["json"] = body
    else:
        dic["data"] = body
    while num < max_try:
        num += 1
        response = request(method, path, **dic)
        __logger__.debug('----------Response-------------\n%s', dump.dump_all(response).decode('utf-8'))
        if response.status_code in allowed_status:
            successful = True
            break
    assert successful, (response.status_code, response.reason)
    return response


def run_command(commands, # type: Union[list, str]
                cwd=None, # type: str
                ):
    command = commands if isinstance(commands,str) else " ".join(commands)
    with safe_chdir(cwd):
        rtn_code = os.system(command)
        if rtn_code:
            raise subprocess.CalledProcessError(rtn_code, commands)