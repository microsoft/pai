import sys
import logging
import logging.config
import subprocess

logger = logging.getLogger(__name__)

def execute_shell(shell_cmd):
    try:
        subprocess.check_call( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        sys.exit(1)



def execute_shell_with_output(shell_cmd):

    try:
        res = subprocess.check_output( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        sys.exit(1)

    return res