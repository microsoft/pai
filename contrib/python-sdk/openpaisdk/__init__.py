import os

__version__ = '0.1.0'
__install__ = '-e "git+https://github.com/Microsoft/pai@yuqyang/sdk#egg=openpaisdk&subdirectory=contrib/python-sdk"'
__default_config__ = os.path.join(os.path.expanduser('~'), 'openpai.json')
