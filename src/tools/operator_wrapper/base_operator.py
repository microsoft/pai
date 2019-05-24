import logging
import requests
import subprocess

logger = logging.getLogger(__name__)


class BaseOperator(object):
    def __init__(self, master_ip, port):
        self.master_ip = master_ip
        self.port = port

    def request(self, api_path, method="get", return_json=True, timeout=10,  **kwargs):

        url = 'http://{}:{}{}'.format(self.master_ip, self.port, api_path)

        logger.debug("{}: {}".format(method, url))
        func = getattr(requests, method)
        response = func(url, timeout=timeout, **kwargs)
        response.raise_for_status()
        if return_json:
            return response.json()
        else:
            return response.text

    def execute(self, command, redirect_stderr=True, shell=True, **kwargs):
        logger.debug(command)
        stderr = subprocess.STDOUT if redirect_stderr else None
        output = subprocess.check_output(command, stderr=stderr, shell=shell, **kwargs).decode("utf8")
        logger.debug(output)
        return output

