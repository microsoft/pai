import unittest
import argparse
from copy import deepcopy
from openpaisdk.cli_utils import get_args, Namespace


def foo(a, b, **kwargs):
    return get_args()


def bar(self, a, b, **kwargs):
    return get_args()


class foobar(Namespace):
    __type__ = 'foobar'
    __fields__ = {"aa": "bb"}

    def define(self,
               parser, #type: argparse.ArgumentParser
               ):
        self.add_argument(parser, '--foo', default='bar')


class TestCliArgs(unittest.TestCase):

    def test_get_args(self):
        args = dict(a=1, b=2, x=10, y=100)
        dic = foo(**args)
        self.assertDictEqual(args, dic)
        args2 = deepcopy(args)
        args2['self'] = None
        dic = bar(**args2)
        self.assertDictEqual(args, dic)

    def test_namespace(self):
        dic = dict(a=1, b=2, x=10, y=100)
        dic2 = dict(type='foobar', foo="bar", aa="bb", **dic)
        self.compare_namespace_with_dic(Namespace(**dic), dic)
        self.compare_namespace_with_dic(Namespace().from_dict(dic), dic)
        self.compare_namespace_with_dic(foobar().from_dict(dic), dic2)

    def compare_namespace_with_dic(self,
                                   ns, #type: Namespace
                                   dic #type: dict
                                   ):
        for k, v in dic.items():
            assert hasattr(ns, k) and getattr(ns, k) == v, "key %s mismatched %s <> %s" % (k, v, getattr(ns, k, None))
        self.assertDictEqual(ns.to_dict(), dic)


