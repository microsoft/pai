import logging
import os

__cache__ = '.openpai'
__global_folder__ = os.path.join(os.path.expanduser('~'), __cache__)
__jobs_cache__ = os.path.join(__cache__, 'jobs')

__cluster_config_file__ = os.path.join(__global_folder__, 'clusters.yaml')
__global_default_file__ = os.path.join(__global_folder__, 'defaults.yaml')
__local_default_file__ = os.path.join(__cache__, 'defaults.yaml')

__version__ = '0.4.00'

__sdk_branch__ = 'master'


def get_install_uri(ver: str=None):
    ver = __sdk_branch__ if not ver else ver
    return '-e "git+https://github.com/Microsoft/pai@{}#egg=openpaisdk&subdirectory=contrib/python-sdk"'.format(ver)


logging.basicConfig(format='%(name)s - %(levelname)s - %(message)s')
__logger__ = logging.getLogger(name="openpai")

if os.path.isfile(os.path.join(__cache__, 'debug_enable')):
    __logger__.setLevel(level=logging.DEBUG)
else:
    __logger__.setLevel(level=logging.INFO)


class __flags__(object):
    disable_to_screen = False  # A flag to disable to_screen output