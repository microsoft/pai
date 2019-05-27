from openpaisdk.cli_utils import Namespace, cli_add_arguments
from openpaisdk.io_utils import web_download_to_folder
import sys
import argparse
from subprocess import check_call


class Requirement(Namespace):

    def process(self):
        pass


class PipRequirement(Requirement):
    __type__ = 'pip-requirement'
    __fields__ = {}

    def define(self, parser: argparse.ArgumentParser):
        cli_add_arguments(self, parser, ['--job-name', '--task-role-name', 'pip_flags'])

    def process(self):
        for p in self.pip_flags:
            check_call([sys.executable, '-m', 'pip', 'install', '-U', p])


class WebLinkRequirement(Requirement):
    __type__ = 'weblink-requirement'
    __fields__ = {}

    def define(self, parser: argparse.ArgumentParser):
        cli_add_arguments(self, parser, ['--job-name', '--task-role-name', '--rename', 'weblink', 'folder'])

    def process(self):
        web_download_to_folder(self.weblink, self.folder, self.rename)