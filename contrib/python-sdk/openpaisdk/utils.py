"""
common functions to
"""
import argparse
import importlib
import inspect
from requests import Response, request
from openpaisdk import __logger__

def attach_args(target=None, expand: list=['kwargs'], ignore: list=['self']):
    caller = inspect.currentframe().f_back
    dic = {k: v for k, v in caller.f_locals.items() if k not in ignore and not k.startswith('__')}
    for k in expand:
        v = dic.pop(k, {})
        dic.update(v)
    if target:
        for k, v in dic.items():
            setattr(target, k, v)
    return dic


class Namespace(argparse.Namespace):
    
    def __init__(self):
        super().__init__
        self.from_argv()

    def to_dict(self):
        dic = vars(self)
        for k, v in dic.items():
            if isinstance(v, Namespace):
                dic[k] = v.to_dict()
        return dic

    def define(self, parser: argparse.ArgumentParser):
        pass

    def from_argv(self, argv: list=[]):
        parser = argparse.ArgumentParser()
        self.define(parser)
        parser.parse_known_args(argv, self)
        return self

    def from_dict(self, dic: dict, ignore_unkown: bool=False):
        for k, v in dic.items():
            if ignore_unkown and not hasattr(self, k):
                continue
            setattr(self, k, v)
        return self


def getobj(name: str):
    mod_name, func_name = name.rsplit('.',1)
    mod = importlib.import_module(mod_name)
    return getattr(mod, func_name)


def get_response(
    path: str, 
    headers: dict={'Content-Type': 'application/json'}, 
    body: dict=dict(), 
    method: str='POST', 
    allowed_status = [200], # type: list[int]
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
