import os


def paictl_version():
    dirname = os.path.dirname(__file__)
    version_file = os.path.join(dirname, '../../version/PAI.VERSION')
    version = open(version_file, 'r').readline()
    return version
