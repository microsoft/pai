import os
from openpaisdk.io_utils import from_file


__version__ = '0.1.0'
__install__ = '-e "git+https://github.com/Microsoft/pai@yuqyang/sdk#egg=openpaisdk&subdirectory=contrib/python-sdk"'
__cluster_config_file__ = os.path.join(os.path.expanduser('~'), '.openpai', 'clusters.json')
__cache__ = '.openpai'
__local_default_file__ = os.path.join(__cache__, 'defaults.json')
__jobs_cache__ = os.path.join(__cache__, 'jobs')

__clients__ = from_file(__cluster_config_file__)
__defaults__ = from_file(__local_default_file__)