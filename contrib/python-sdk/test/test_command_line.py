import unittest
import os
from copy import deepcopy
from subprocess import CalledProcessError
from openpaisdk.command_line import EngineRelease
from openpaisdk.utils import run_command, find_match


def run_test_command(cmd: str, args: dict):
    run_command(" ".join([cmd] + ["--%s %s" % (k, v) for k, v in args.items()]))


def gen_expected(dic: dict, **kwargs):
    dic2 = {k.replace("-", "_"): v if k!="passwd" else "******" for k, v in dic.items()}
    dic2.update(kwargs)
    return dic2


class TestCliArgs(unittest.TestCase):

    def test_cluster(self):
        cluster_ut = {
            "cluster-alias": "cluster-for-test",
            "pai-uri": "http://x.x.x.x",
            "user": "myuser",
            "passwd": "password",
        }
        hdfs_ut = {
            "storage-alias": "hdfs-for-test",
            "web-hdfs-uri": "http://x.x.x.x:yyyy",
        }
        alias = cluster_ut["cluster-alias"]
        # test for command `opai cluster add` and `opai cluster list`
        run_test_command("opai cluster add", cluster_ut)
        cluster_bk = EngineRelease().process(['cluster', 'list'])[alias]
        expectedOutput = gen_expected(cluster_ut)
        expectedOutput["storages"] = []
        self.assertDictEqual(expectedOutput, cluster_bk)

        # test for command `opai cluster attach-hdfs`
        with self.assertRaises(CalledProcessError):
            run_test_command("opai cluster attach-hdfs", hdfs_ut)
        run_test_command("opai cluster attach-hdfs -a %s" % alias, hdfs_ut)
        cluster_bk = EngineRelease().process(['cluster', 'list'])[alias]
        expectedOutput["storages"].append(gen_expected(hdfs_ut, user="myuser", protocol="webHDFS"))
        self.assertDictEqual(expectedOutput, cluster_bk)

