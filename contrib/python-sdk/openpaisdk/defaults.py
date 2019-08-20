
""" this module is to set a way to control the predefined configurations
"""
import os
from collections import namedtuple
from typing import List
from openpaisdk import __logger__, __global_default_file__, __local_default_file__, __container_sdk_branch__
from openpaisdk.io_utils import from_file, to_file, to_screen


CfgItem = namedtuple('CfgItem', "name default abbreviation description", verbose=False)


class CfgDict(dict):

    def __init__(self, cfgs: List[CfgItem], undefined: str = "warn", load_default: bool = False, **kwargs):
        self._undefined = undefined
        self._predefined = cfgs
        self._predefined_dict = {c.name: c.default for c in cfgs}
        if load_default:
            for c in cfgs:
                dict.__setitem__(self, c.name, c.default)
        assert undefined in ["warn", "fatal"], "unknown undefined operation {}".format(undefined)
        for key, val in kwargs.items():
            self.__setitem__(key, val)

    def _check(self, key):
        if key in (c.name for c in self._predefined):
            return True
        msg = "key {} not in predefined keys {}".format(key, [c.name for c in self._predefined])
        if self._undefined == "warn":
            to_screen(msg, is_warn=True)
            return False
        raise KeyError(msg)

    def __setitem__(self, key, val):
        self._check(key)
        dict.__setitem__(self, key, val)

    @property
    def predefined(self):
        return self._predefined

    def print(self):
        if self.predefined:
            to_screen(self.predefined, is_table=True, headers=self.predefined[0]._asdict().keys())


__default_job_resources__ = {
    "ports": {}, "gpu": 0, "cpu": 4, "memoryMB": 8192,
}


__predefined_defaults__ = [
    CfgItem("cluster-alias", None, "a", "cluster alias"),
    CfgItem("virtual-cluster", None, "vc", "virtual cluster name"),
    CfgItem("storage-alias", None, "s", "alias of storage to use"),
    CfgItem("workspace", None, "w", "storage root for a job to store its codes / data / outputs ..."),
    CfgItem("container-sdk-branch", __container_sdk_branch__, None,
            "code branch to install sdk from (in a job container)"),
    CfgItem("image", None, "i", "docker image"),
    CfgItem("cpu", __default_job_resources__["cpu"], None, "cpu number per instance"),
    CfgItem("gpu", __default_job_resources__["gpu"], None, "gpu number per instance"),
    CfgItem("memoryMB", __default_job_resources__["memoryMB"], None, "memory (MB) per instance"),
    CfgItem("sources", [], "src", "source files to upload (into container)"),
    CfgItem("pip-installs", [], "pip", "packages to install via pip"),
]


def read_global_defaults():
    if os.path.isfile(__global_default_file__):
        return from_file(__global_default_file__, default="==FATAL==")
    return {}


def read_per_folder_defaults():
    if os.path.isfile(__local_default_file__):
        return from_file(__local_default_file__, default="==FATAL==")
    return {}


def read_defaults(global_only: bool = False):
    "read values in the default file, not consider __predefined_defaults__"
    dic = read_global_defaults()
    if not global_only:
        dic.update(read_per_folder_defaults())
    return dic


def get_defaults(global_only: bool = False):
    "read_defaults, but return __predefined_defaults__ if not assert"
    dic = CfgDict(__predefined_defaults__, **read_defaults(global_only))
    return dic


def update_default(key: str, value: str = None, is_global: bool = False, to_delete: bool = False):
    filename = __global_default_file__ if is_global else __local_default_file__
    dic = read_global_defaults() if is_global else read_per_folder_defaults()
    dic = CfgDict(__predefined_defaults__, **dic)
    if to_delete:
        if key not in dic:
            to_screen("key %s not found in %s, ignored" % (key, filename))
            return
        del dic[key]
    else:
        to_screen("key %s updated to %s in %s" % (key, value, filename))
        dic[key] = value
    to_file(dic, filename)
