import logging
import requests
import subprocess

logger = logging.getLogger(__name__)


def request_without_exception(url, log_flag=True, method="get", timeout=10,  **kwargs):
    if not hasattr(requests, method):
        logger.error("unknown http method: {}".format(method))
        return None
    logger.debug("{}: {}".format(method, url))
    func = getattr(requests, method)
    try:
        response = func(url, timeout=timeout, **kwargs)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        if log_flag:
            logger.error("http request error", exc_info=True)
        return None
    except Exception as e:
        if log_flag:
            logger.error("unknown error", exc_info=True)
        return None

    return response


def command_without_exception(command, log_flag=True, redirect_stderr=True, shell=True, **kwargs):
    logger.debug(command)
    stderr = subprocess.STDOUT if redirect_stderr else None
    try:
        output = subprocess.check_output(command, stderr=stderr, shell=shell, **kwargs).decode("utf8")
    except subprocess.CalledProcessError as e:
        if log_flag:
            logger.error("execute command error", exc_info=True)
        return None
    except Exception as e:
        if log_flag:
            logger.error("unknown error", exc_info=True)
        return None

    return output


def safe_get(dct, *keys):
    for key in keys:
        try:
            dct = dct[key]
        except KeyError:
            return None
    return dct
