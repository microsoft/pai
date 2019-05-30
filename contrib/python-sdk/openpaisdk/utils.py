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


def find_match(lst: iter, key: str=None, attr: str=None, target=None):
    if key:
        return [x for x in lst if x[key] == target]
    if attr:
        return [x for x in lst if getattr(x, attr) == target]


def list2dict(lst: list, key: str, skip_key_err: bool=True):
    return {x[key]:x for x in lst if key in x}


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