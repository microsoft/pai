import unittest
import argparse
from copy import deepcopy
from openpaisdk.cli_arguments import get_args, Namespace, get_dest_name, dict_to_argv


def foo(a, b, **kwargs):
    return get_args()


def bar(self, a, b, **kwargs):
    return get_args()


class foobar(Namespace):
    __type__ = 'foobar'
    __fields__ = {
        "aa": "xx",
        "bb": {
            "help": "message for bb",
            "default": "yy",
        }
    }

    def define(self,
               parser, #type: argparse.ArgumentParser
               ):
        super().define(parser)
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

    def test_get_dest_name(self):
        self.assertEqual("a", get_dest_name("-a"))
        self.assertEqual("aa", get_dest_name("--aa"))

    def test_dict2argv(self):
        parser = argparse.ArgumentParser()
        parser.add_argument('--foo')
        parser.add_argument('--bar', action="store_true")
        for bar in [True, False]:
            dic = dict(foo="foo", bar=bar, foobar=0)
            lst = dict_to_argv(parser, dic)
            print(lst)
            self.assertDictEqual(dict(foo="foo", bar=bar), vars(parser.parse_args(lst)))
            self.assertDictEqual(dic, dict(foobar=0))

    def test_namespace(self):
        dic = dict(a=1, b=2, x=10, y=100)
        dic2 = dict(type='foobar', foo="bar", aa="xx", bb="yy", **dic)
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


