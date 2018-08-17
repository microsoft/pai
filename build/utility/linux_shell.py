import sys
import logging
import logging.config
import subprocess

logger = logging.getLogger(__name__)

def execute_shell(shell_cmd, error_msg):
    try:
        subprocess.check_call( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        logger.error(error_msg)
        sys.exit(1)



def execute_shell_with_output(shell_cmd, error_msg):

    try:
        res = subprocess.check_output( shell_cmd, shell=True )

    except subprocess.CalledProcessError:
        logger.error(error_msg)
        sys.exit(1)

    return res