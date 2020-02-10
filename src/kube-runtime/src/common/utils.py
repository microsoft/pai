import logging
import re

import pystache


def init_logger():
    logging.basicConfig(
        format=
        "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
        level=logging.INFO,
    )


def _convert_to_dict(obj) -> dict:
    converted_obj = {}
    if isinstance(obj, list):
        for i, value in enumerate(obj):
            converted_obj[str(i)] = value
    elif isinstance(obj, dict):
        for key, value in obj.items():
            converted_obj[key] = _convert_to_dict(value)
    else:
        converted_obj = obj
    return converted_obj


def enable_request_debug_log(func):
    def wrapper(*args, **kwargs):
        requests_log = logging.getLogger("urllib3")
        level = requests_log.level
        requests_log.setLevel(logging.DEBUG)
        requests_log.propagate = True

        try:
            return func(*args, **kwargs)
        finally:
            requests_log.setLevel(level)
            requests_log.propagate = False

    return wrapper


def render_string_with_secrets(string, secrets) -> str:
    if not secrets:
        return string
    secret_dict = _convert_to_dict(secrets)
    parsed = pystache.parse(string, delimiters=("<%", "%>"))
    for token in parsed._parse_tree:  #pylint: disable=protected-access
        if isinstance(token, pystache.parser._EscapeNode):  #pylint: disable=protected-access
            token.key = re.sub(
                r"\[(\d+)\]", r".\1",
                token.key)  # make format such as $secrets.data[0] works
    return pystache.Renderer().render(parsed, {"$secrets": secret_dict})
