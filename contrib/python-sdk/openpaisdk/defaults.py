
# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


""" this module is to set a way to control the predefined configurations
"""
from openpaisdk.flags import __flags__
from openpaisdk.utils import na, OrganizedList
from openpaisdk.io_utils import from_file, to_file, to_screen


class CfgLayer:

    def __init__(self, name: str, include: list = None, exclude: list = None, file: str = None, values: dict = None, allow_unknown: bool = True):
        self.name = name
        self.file = file
        self.values = from_file(file, {}, silent=True) if file else na(values, {})
        self.definitions = OrganizedList(
            __flags__.default_var_definitions(),
            _key="name"
        ).filter(None, include, exclude)  # type: OrganizedList

    def update(self, key: str, value=None, delete: bool = False):
        if not self.allow(key):
            to_screen(f"{key} is not a recognized default variable, ignored")
            return
        dic = self.values
        if delete:
            if key not in dic:
                to_screen(f"key {key} not found in {self.name}, ignored")
            elif not self.act_append(key) or not value:  # delete the key when not append action
                del dic[key]
                to_screen(f"key {key} removed completely from {self.name} successfully")
            else:
                dic[key].remove(value)
                to_screen(f"{value} removed in {key} under {self.name} successfully")
        else:
            if self.act_append(key):
                def _append(dic, key, value):
                    dic.setdefault(key, [])
                    if value not in dic[key]:
                        dic[key].append(value)
                _append(dic, key, value)
                to_screen(f"{value} added to {key} under {self.name} successfully")
            else:
                dic[key] = value
                to_screen(f"{key} set to {value} under {self.name} successfully")
        if self.file:
            to_file(self.values, self.file)

    def allow(self, key: str):
        return self.definitions.first_index(key) is not None

    def act_append(self, key: str):
        if self.allow(key):
            return self.definitions.first(key).get("action", None) == "append"
        return False


class LayeredSettings:
    """key-value querying from a list of dicts, priority depends on list index
    refer to [TestDefaults](../tests/test_utils.py) for more usage examples
    """

    layers = None
    definitions = None

    @classmethod
    def init(cls):
        if cls.layers is None:
            cls.reset()

    @classmethod
    def reset(cls):
        cls.definitions = OrganizedList(__flags__.default_var_definitions(), _key="name").as_dict
        cls.layers = OrganizedList([
            CfgLayer(
                name="user_advaced",
                exclude=["clusters-in-local", "image-list", "resource-specs"]
            ),
            CfgLayer(
                name="user_basic",
                exclude=["clusters-in-local", "image-list", "resource-specs"]
            ),
            CfgLayer(
                name="local_default",
                exclude=[], file=__flags__.get_default_file(is_global=False)
            ),
            CfgLayer(
                name="global_default",
                exclude=[], file=__flags__.get_default_file(is_global=True)
            )
        ], _key="name", _getter=getattr)

    @classmethod
    def keys(cls):
        dic = set()
        for layer in cls.layers:
            for key in layer.values.keys():
                dic.add(key)
        dic = dic.union(cls.definitions.keys())
        return list(dic)

    @classmethod
    def act_append(cls, key):
        return cls.definitions.get(key, {}).get("action", None) == "append"

    @classmethod
    def get(cls, key):
        __not_found__ = "==Not-Found=="
        lst = [layer.values.get(key, __not_found__) for layer in cls.layers]
        lst.append(cls.definitions.get(key, {}).get("default", None))
        lst = [x for x in lst if x != __not_found__]

        if cls.act_append(key):
            from openpaisdk.utils import flatten
            return list(flatten(lst))
        else:
            return lst[0] if lst else None

    @classmethod
    def update(cls, layer: str, key: str, value=None, delete: bool = False):
        cls.layers.first(layer).update(key, value, delete)

    @classmethod
    def as_dict(cls):
        return {key: cls.get(key) for key in cls.keys()}

    @classmethod
    def print_supported_items(cls):
        headers = ['name', 'default', 'help']
        return to_screen([
            [x.get(k, None) for k in headers] for x in __flags__.default_var_definitions()
        ], _type="table", headers=headers)


LayeredSettings.init()


def get_defaults(en_local=True, en_global=True, en_predefined=True):
    return LayeredSettings.as_dict()


def update_default(key: str, value: str = None, is_global: bool = False, to_delete: bool = False):
    layer = "global_default" if is_global else "local_default"
    LayeredSettings.update(layer, key, value, to_delete)


def get_install_uri(ver: str = None):
    ver = get_defaults()["container-sdk-branch"] if not ver else ver
    return '-e "git+https://github.com/Microsoft/pai@{}#egg=openpaisdk&subdirectory=contrib/python-sdk"'.format(ver)
