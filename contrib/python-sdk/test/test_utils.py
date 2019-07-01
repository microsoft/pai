import unittest
from argparse import Namespace
from copy import deepcopy

from openpaisdk.utils import OrganizedList as ol
from openpaisdk.utils import Nested


class TestOrganizedList(unittest.TestCase):

    lst = [dict(a="x", b=0), dict(a="x", c=1), dict(a="y", d=2)]

    def test_dict(self):
        lst = deepcopy(self.lst)
        lst2 = deepcopy(lst)
        # filter
        self.assertDictEqual({"matches":[lst[2]], "indexes":[2]}, ol.filter(lst, "a", "y"))
        # as_dict
        self.assertDictEqual(dict(x=lst[1], y=lst[2]), ol.as_dict(lst, "a"))
        # add (update)
        elem = dict(a="y", b="z", c="z")
        lst2[2].update(elem)
        self.assertTrue(ol.add(lst, "a", elem))
        self.assertListEqual(lst, lst2)
        # add append
        elem = dict(a="z", f=4)
        lst2.append(elem)
        self.assertFalse(ol.add(lst, "a", elem))
        self.assertListEqual(lst, lst2)
        # delete
        ol.delete(lst, "d", 2)
        del lst2[2]
        self.assertListEqual(lst, lst2)


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

