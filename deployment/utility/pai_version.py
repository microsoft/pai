import os
import subprocess
import logging
from ..paiLibrary.common import linux_shell

logger = logging.getLogger(__name__)


def paictl_version():
    dirname = os.path.dirname(__file__)
    version_file = os.path.join(dirname, '../../version/PAI.VERSION')
    version = open(version_file, 'r').readline()
    return version.strip() # remove '\n' from readline() https://docs.python.org/3/tutorial/inputoutput.html


def cluster_version():
    version = ""
    try:
        version = subprocess.check_output("kubectl get configmap pai-version -o jsonpath='{.data.PAI\.VERSION}'", shell=True)
    except subprocess.CalledProcessError:
        logger.warning("Can't fetch cluster version!")
    return version.strip() # same as paictl_version


def check_cluster_version():
    c_version = cluster_version()
    p_version = paictl_version()
    logger.info("Cluster version: %s, paictl version: %s", c_version, p_version)
    if p_version != c_version:
        # TODO, now we only print a warning info
        logger.warn("!!! Paictl version is different from the cluster version: %s != %s", c_version, p_version)
        return False
    return True
