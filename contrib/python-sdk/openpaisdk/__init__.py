import importlib
import logging
import os
import json


def getobj(name: str):
    mod_name, func_name = name.rsplit('.',1)
    mod = importlib.import_module(mod_name)
    return getattr(mod, func_name)


def from_json_file(fname: str, default={}):
    try:
        with open(fname) as fp:
            return json.load(fp)
    except Exception:
        return default


__version__ = '0.2.0'

__cluster_config_file__ = os.path.join(os.path.expanduser('~'), '.openpai', 'clusters.json')
__cache__ = '.openpai'
__local_default_file__ = os.path.join(__cache__, 'defaults.json')
__jobs_cache__ = os.path.join(__cache__, 'jobs')


__defaults__ = from_json_file(__local_default_file__)

__sdk_branch__ = __defaults__.get('sdk-branch', 'sdk-preview-v0.2')

__install__ = '-e "git+https://github.com/Microsoft/pai@{}#egg=openpaisdk&subdirectory=contrib/python-sdk"'.format(__sdk_branch__)

logging.basicConfig(format='%(name)s - %(levelname)s - %(message)s')
__logger__ = logging.getLogger()
__logger__.setLevel(level=int(__defaults__.get('logging-level', 35)))