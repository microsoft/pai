import logging
import os


def return_default_if_error(func):
    def f(*args, default="==FATAL==", **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as identifier:
            if default == "==FATAL==":
                __logger__.error('Error: %s', e, exc_info=True)
            __logger__.debug('error occurs, return default (%s)', default)
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


__cluster_config_file__ = os.path.join(os.path.expanduser('~'), '.openpai', 'clusters.yaml')
__cache__ = '.openpai'
__local_default_file__ = os.path.join(__cache__, 'defaults.json')
__jobs_cache__ = os.path.join(__cache__, 'jobs')


__defaults__ = from_json_file(__local_default_file__)

__version__ = '0.4.00'

__sdk_branch__ = __defaults__.get('sdk-branch', 'sdk-release-v0.4.00')

__install__ = '-e "git+https://github.com/Microsoft/pai@{}#egg=openpaisdk&subdirectory=contrib/python-sdk"'.format(__sdk_branch__)

logging.basicConfig(format='%(name)s - %(levelname)s - %(message)s')
__logger__ = logging.getLogger()
__logger__.setLevel(level=int(__defaults__.get('logging-level', 35)))