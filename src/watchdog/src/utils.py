import re


def walk_json_field_safe(obj, *fields):
    """ for example a=[{"a": {"b": 2}}]
    walk_json_field_safe(a, 0, "a", "b") will get 2
    walk_json_field_safe(a, 0, "not_exist") will get None
    """
    try:
        for f in fields:
            obj = obj[f]
        return obj
    except (NameError, KeyError):
        return None


def convert_to_byte(data):
    data = data.lower()
    number = float(re.findall(r"[0-9.]+", data)[0])
    if "t" in data:
        return number * 10**12
    elif "g" in data:
        return number * 10**9
    elif "m" in data:
        return number * 10**6
    elif "k" in data:
        return number * 10**3
    elif "ti" in data:
        return number * 2**40
    elif "gi" in data:
        return number * 2**30
    elif "mi" in data:
        return number * 2**20
    elif "ki" in data:
        return number * 2**10
    else:
        return number
