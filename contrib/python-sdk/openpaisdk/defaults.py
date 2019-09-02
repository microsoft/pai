
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
        dic = self.values
        if delete:
            if key not in dic:
                to_screen(f"key {key} not found in {self.name}, ignored")
            elif not self.act_append(key) or value is None:  # delete the key
                dic[key] = []
                to_screen(f"key {key} removed in {self.name} successfully")
            else:
                if not value:
                    del dic[key]
                    to_screen(f"key {key} removed totally from {self.name} successfully")
                else:
                    s = set(dic[key])
                    s.discard(value)
                    dic[key] = list(s)
                    to_screen(f"{value} removed in {key} under {self.name} successfully")
        else:
            if not self.allow(key):
                to_screen(f"{key} is not a recognized default variable, ignored")
            elif self.act_append(key):
                def _append_as_set(dic, key, value):
                    dic.setdefault(key, [])
                    s = set(dic[key])
                    s.add(value)
                    dic[key] = list(s)
                _append_as_set(dic, key, value)
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
    "key-value querying from a list of dicts, priority depends on list index"

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
            return list(set(flatten(lst)))
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
        to_screen([
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
