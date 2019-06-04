"""
common functions to
"""
import importlib
import os
from copy import deepcopy
from requests import Response, request
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
        for index in sorted(indexes, reverse=True):
            del lst[index]
        return lst


def psel(*args, default=None):
    """select with priority"""
    for a in args:
        if not a:
            continue
        return a
    return default


def merge_two_object(a: dict, b: dict):
    y = deepcopy(a)
    y.update(b)
    return y


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
    while num < max_try:
        num += 1
        response = request(
            method, path, headers=headers, json=body
        )
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