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


import os
import unittest
from copy import deepcopy
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.utils import Nested
from openpaisdk.utils import randstr
from openpaisdk.io_utils import __flags__, from_file, to_screen
from openpaisdk import get_defaults, update_default, LayeredSettings
from basic_test import seperated


class TestIOUtils(unittest.TestCase):

    @seperated
    def test_reading_failures(self):
        with self.assertRaises(Exception):  # non existing file
            from_file(randstr(8) + '.yaml')
        with self.assertRaises(AssertionError):  # unsupported file extension
            from_file(randstr(10))
        with self.assertRaises(Exception):
            fname = randstr(10) + '.json'
            os.system(f"touch {fname}")
            from_file(fname)

    @seperated
    def test_returning_default(self):
        for dval in [[], ['a', 'b'], {}, {'a': 'b'}]:
            ass_fn = self.assertListEqual if isinstance(dval, list) else self.assertDictEqual
            with self.assertRaises(AssertionError):  # unsupported file extension
                from_file(randstr(10))
            fname = randstr(8) + '.yaml'
            ass_fn(from_file(fname, dval), dval)  # non existing
            os.system(f"echo '' > {fname}")
            ass_fn(from_file(fname, dval), dval)
            os.system(f"echo 'abcd' > {fname}")
            ass_fn(from_file(fname, dval), dval)


class TestDefaults(unittest.TestCase):

    global_default_file = __flags__.get_default_file(is_global=True)
    local_default_file = __flags__.get_default_file(is_global=False)

    def get_random_var_name(self):
        import random
        from openpaisdk import LayeredSettings
        lst = [x for x in LayeredSettings.keys() if not LayeredSettings.act_append(x)]
        ret = lst[random.randint(0, len(lst) - 1)]
        to_screen(f"random select {ret} in {lst}")
        return ret

    @seperated
    def test_update_defaults(self):
        # ! not test global defaults updating, test it in integration tests
        test_key, test_value = self.get_random_var_name(), randstr(10)
        # add a default key
        update_default(test_key, test_value, is_global=False, to_delete=False)
        self.assertEqual(get_defaults()[test_key], test_value,
                         msg=f"failed to check {test_key} in {LayeredSettings.as_dict()}")
        # should appear in local
        self.assertEqual(from_file(self.local_default_file)[test_key], test_value)
        # delete
        update_default(test_key, test_value, is_global=False, to_delete=True)
        with self.assertRaises(KeyError):
            os.system(f"cat {self.local_default_file}")
            from_file(self.local_default_file, {})[test_key]
        # add not allowed
        test_key = randstr(10)
        update_default(test_key, test_value, is_global=False, to_delete=False)
        with self.assertRaises(KeyError):
            from_file(self.local_default_file, {})[test_key]

    @seperated
    def test_layered_settings(self):
        from openpaisdk import LayeredSettings, __flags__
        __flags__.custom_predefined = [
            {
                'name': 'test-key-1',
            },
            {
                'name': 'test-key-2',
                'action': 'append',
                'default': []
            }
        ]
        LayeredSettings.reset()
        # ? add / update append key
        for test_key in ['test-key-1', 'test-key-2']:
            for i, layer in enumerate(LayeredSettings.layers):
                LayeredSettings.update(layer.name, test_key, i)
                if layer.act_append(test_key):
                    self.assertTrue(isinstance(layer.values[test_key], list), msg=f"{layer.values}")
        self.assertEqual(0, LayeredSettings.get('test-key-1'))
        self.assertListEqual([0, 1, 2, 3], LayeredSettings.get('test-key-2'))
        # ? delete
        for test_key in ['test-key-1', 'test-key-2']:
            for i, layer in enumerate(LayeredSettings.layers):
                LayeredSettings.update(layer.name, test_key, None, delete=True)
        # ? reset the predefined
        __flags__.custom_predefined = []
        LayeredSettings.reset()

    @seperated
    def test_unknown_variable_defined(self):
        from openpaisdk import LayeredSettings, __flags__
        test_key, test_value = 'test-key-long-existing', randstr(10)
        __flags__.custom_predefined = [
            {
                'name': test_key,
            },
        ]
        LayeredSettings.reset()
        # ? add / update append key
        LayeredSettings.update('local_default', test_key, test_value)
        # ? reset the predefined
        __flags__.custom_predefined = []
        LayeredSettings.reset()
        self.assertEqual(test_value, LayeredSettings.get(test_key))
        # cannot delete or change the unknown variable
        LayeredSettings.update('local_default', test_key, randstr(10))
        LayeredSettings.reset()
        self.assertEqual(test_value, LayeredSettings.get(test_key))
        LayeredSettings.update('local_default', test_key, delete=True)
        LayeredSettings.reset()
        self.assertEqual(test_value, LayeredSettings.get(test_key))


class TestOrganizedList(unittest.TestCase):

    class foo:

        def __init__(self, a=None, b=None, c=None, d=None):
            self.a, self.b, self.c, self.d = a, b, c, d

        @property
        def as_dict(self):
            return {k: v for k, v in vars(self).items() if v is not None}

        def update(self, other):
            for key, value in other.as_dict.items():
                setattr(self, key, value)

    lst_objs = [foo("x", 0), foo("x", 1), foo("y", 2), foo("y", c=1), foo("z", 4)]
    lst = [obj.as_dict for obj in lst_objs]

    def ol_test_run(self, lst, getter):
        def to_dict(obj):
            return obj if isinstance(obj, dict) else obj.as_dict
        dut = ol(lst[:3], "a", getter)
        # find
        self.assertEqual(2, dut.first_index("y"))
        self.assertDictEqual(to_dict(lst[2]), to_dict(dut.first("y")))
        # filter
        self.assertListEqual([0, 1], dut.filter_index("x"))
        self.assertListEqual(lst[:2], dut.filter("x").as_list)
        # as_dict
        self.assertDictEqual(dict(x=lst[1], y=lst[2]), dut.as_dict)
        # add (update)
        elem = lst[-2]
        dut.add(elem)
        self.assertEqual(2, getter(lst[2], "b"))
        self.assertEqual(1, getter(lst[2], "c"))
        # add (replace)
        elem = lst[-2]
        dut.add(elem, replace=True)
        self.assertEqual(None, getter(dut[2], "b"))
        # add (append)
        elem = lst[-1]
        dut.add(elem)
        self.assertEqual(4, getter(dut[-1], "b"))
        # delete
        dut.remove("z")
        self.assertEqual(3, len(dut))
        dut.remove("z")
        self.assertEqual(3, len(dut))

    def test_dict(self):
        self.ol_test_run(deepcopy(self.lst), dict.get)

    def test_obj(self):
        self.ol_test_run(deepcopy(self.lst_objs), getattr)


class TestNested(unittest.TestCase):

    def test_set(self):
        nested_obj = {
            "a": [
                {
                    "aa0": {
                        "aaa": "val_aaa"
                    },
                },
                {
                    "aa1": {
                        "aaa1": "val_aaa1"
                    }
                }

            ],
            "b": "haha"
        }
        n = Nested(nested_obj, sep="->")
        self.assertEqual(n.get("a->0->aa0->aaa"), "val_aaa")
        with self.assertRaises(KeyError):
            nested_obj["a"][1]["aa2"]["aaa"]
        n.set("a->1->aa2->aaa", "val_aaa2")
        self.assertEqual(nested_obj["a"][1]["aa2"]["aaa"], "val_aaa2")
