import os
import subprocess
import logging

logger = logging.getLogger(__name__)


def paictl_version():
    dirname = os.path.dirname(__file__)
    version_file = os.path.join(dirname, '../../version/PAI.VERSION')
    version = open(version_file, 'r').readline()
    logger.info("paictl version: %s", version)

    return version.strip() # remove '\n' from readline() https://docs.python.org/3/tutorial/inputoutput.html


def cluster_version():
    version = ""
    try:
        # redicret stderr to devnull
        DEVNULL = open(os.devnull, 'w')
        version = subprocess.check_output("kubectl get configmap pai-version -o jsonpath='{.data.PAI\.VERSION}'", shell=True, stderr=DEVNULL)
        logger.info("Cluster version: %s", version)
    except subprocess.CalledProcessError:
        logger.warning("Can't fetch cluster version!")

    return version.strip() # same as paictl_version


def check_cluster_version():
    """
    Compare cluster PAI.VERSION with loal PAI.VERSION
    """
    c_version = cluster_version()
    p_version = paictl_version()

    if not c_version or p_version != c_version:
        logger.warning("The paictl version is different from the cluster version")
        logger.warning('Ignore this message if you are upgrading, downgrading or deploying the cluster form scratch.')
        return False

    return True
