import unittest
import openpaisdk.utils as ou
from copy import deepcopy


class TestUtils(unittest.TestCase):

    def test_list_and_dict(self):
        lst = [dict(a="x", b=0), dict(a="x", c=1), dict(a="y", d=2), dict(e=3)]
        dic = {
            "x": dict(a="x", c=1),
            "y": dict(a="y", d=2),
        }
        self.assertDictEqual(dic, ou.list2dict(lst, "a"))
        lst2 = deepcopy(lst)
        elem = dict(a="y", b="z", c="z")
        lst2[2].update(elem)
        ou.append_or_update(lst, "a", elem)
        self.assertListEqual(lst, lst2)
        elem = dict(a="z", f=4)
        lst2.append(elem)
        ou.append_or_update(lst, "a", elem)
        self.assertListEqual(lst, lst2)
