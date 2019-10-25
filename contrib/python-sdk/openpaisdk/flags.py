# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


import os


class __flags__(object):
    "store the flags and constants"
    disable_to_screen = False  # A flag to disable to_screen output
    debug_mode = os.path.isfile('debug_enable')

    # ! below attributes should not be changed
    cache = '.openpai'
    cluster_cfg_file = 'clusters.yaml'
    defaults_file = 'defaults.yaml'
    container_sdk_branch = 'master'
    resources_requirements = dict(cpu=2, gpu=0, memoryMB=4096, ports={})
    storage_root = '/openpai-sdk'
    custom_predefined = []

    @staticmethod
    def default_var_definitions():
        return [
            {
                "name": "clusters-in-local",
                "default": "no",
                "help": f"[yes / no], if yes, clusters configuration stored in {__flags__.get_cluster_cfg_file('yes')} other than ~/{__flags__.get_cluster_cfg_file('yes')}",
            },
            {
                "name": "cluster-alias",
                "abbreviation": "a",
                "help": "cluster alias",
            },
            {
                "name": "virtual-cluster",
                "abbreviation": "vc",
                "help": "virtual cluster name"
            },
            {
                "name": "storage-alias",
                "abbreviation": "s",
                "help": "alias of storage to use"
            },
            {
                "name": "workspace",
                "default": None,
                "abbreviation": "w",
                "help": f"storage root for a job to store its codes / data / outputs ... (default is {__flags__.storage_root}/$user)"
            },
            {
                "name": "container-sdk-branch",
                "default": __flags__.container_sdk_branch,
                "help": "code branch to install sdk from (in a job container)"
            },
            {
                "name": "image",
                "abbreviation": "i",
                "help": "docker image"
            },
            {
                "name": "cpu",
                "help": f"cpu number per instance (default is {__flags__.resources_requirements['cpu']})"
            },
            {
                "name": "gpu",
                "help": f"gpu number per instance (default is {__flags__.resources_requirements['gpu']})"
            },
            {
                "name": "memoryMB",
                "help": f"memory (MB) per instance (default is {__flags__.resources_requirements['memoryMB']}) (will be overriden by --mem)"
            },
            {
                "name": "mem",
                "help": "memory (MB / GB) per instance (default is %.0fGB)" % (__flags__.resources_requirements["memoryMB"] / 1024.0)
            },
            {
                "name": "sources",
                "default": [],
                "abbreviation": "src",
                "action": "append",
                "help": "source files to upload (into container)"
            },
            {
                "name": "pip-installs",
                "default": [],
                "abbreviation": "pip",
                "action": "append",
                "help": "packages to install via pip"
            },
            {
                "name": "image-list",
                "default": [],
                "action": "append",
                "help": "list of images that are frequently used"
            },
            {
                "name": "resource-list",
                "default": [],
                "action": "append",
                "help": "list of resource specs that are frequently used"
            },
            {
                "name": "web-default-form",
                "help": "web-default-form (in Submitter)"
            },
            {
                "name": "web-default-image",
                "help": "web-default-image (in Submitter)"
            },
            {
                "name": "web-default-resource",
                "help": "web-default-resource (in Submitter), format: '<gpu>,<cpu>,<memoryMB>'"
            },
        ] + __flags__.custom_predefined

    @staticmethod
    def get_cluster_cfg_file(clusters_in_local: str = 'no') -> str:
        assert clusters_in_local in ['no', 'yes'], f"only allow yes / no, but {clusters_in_local} received"
        pth = [__flags__.cache, __flags__.cluster_cfg_file]
        if clusters_in_local == 'no':
            pth = [os.path.expanduser('~')] + pth
        return os.path.join(*pth)

    @staticmethod
    def get_default_file(is_global: bool) -> str:
        pth = [__flags__.cache, __flags__.defaults_file]
        pth = [os.path.expanduser('~')] + pth if is_global else pth
        return os.path.join(*pth)

    @staticmethod
    def print_predefined(exclude: list = None, include: list = None):
        from tabulate import tabulate
        citems = __flags__.predefined_defaults(exclude, include)
        print(tabulate(citems, headers=citems[0]._asdict().keys()), flush=True)
