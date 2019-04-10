import os
from ..paiLibrary.common import linux_shell


def paictl_version():
    dirname = os.path.dirname(__file__)
    version_file = os.path.join(dirname, '../../version/PAI.VERSION')
    version = open(version_file, 'r').readline()
    return version


def cluster_version():
    cluster_version = linux_shell.execute_shell_with_output("kubectl get configmap pai-version -o jsonpath='{.data.PAI\.VERSION}'", "Can't fetch cluster version!")
    return cluster_version
