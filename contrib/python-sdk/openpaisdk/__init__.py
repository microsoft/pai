import logging
import os

__cache__ = '.openpai'

__cluster_config_file__ = os.path.join(os.path.expanduser('~'), __cache__, 'clusters.json')
__local_default_file__ = os.path.join(__cache__, 'defaults.json')
__jobs_cache__ = os.path.join(__cache__, 'jobs')

__version__ = '0.4.00'

__sdk_branch__ = 'sdk-release-v0.4.00'


def get_install_uri(ver: str=__sdk_branch__):
    return '-e "git+https://github.com/Microsoft/pai@{}#egg=openpaisdk&subdirectory=contrib/python-sdk"'.format(ver)


logging.basicConfig(format='%(name)s - %(levelname)s - %(message)s')
__logger__ = logging.getLogger(name="openpai")

if os.path.isfile(os.path.join(__cache__, 'debug_enable')):
    __logger__.setLevel(level=logging.DEBUG)
else:
    __logger__.setLevel(level=logging.INFO)