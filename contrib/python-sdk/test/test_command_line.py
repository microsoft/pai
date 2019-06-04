import unittest
import os
from copy import deepcopy
from subprocess import CalledProcessError
from shutil import rmtree
from openpaisdk.command_line import EngineRelease
from openpaisdk.utils import run_command
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.job import Job, Namespace, from_file
from typing import Union


def get_cmd(cmd: Union[str, list], flags: dict, args: Union[list, str]=None):
    lst = []
    lst.extend(cmd if isinstance(cmd, list) else cmd.split())
    for flag, value in flags.items():
        lst.extend(["--" + flag, value.__str__()])
    if args:
        lst.extend(args if isinstance(args, list) else args.split())
    return lst


def run_commands(*cmds, sep: str='&&'):
    lst = []
    for i, c in enumerate(cmds):
        lst.extend(c)
        if i != len(cmds) - 1:
            lst.append(sep)
    run_command(lst)


def run_test_command(cmd: Union[str, list], flags: dict, args: Union[list, str]=None):
    run_command(get_cmd(cmd, flags, args))


def gen_expected(dic: dict, **kwargs):
    dic2 = {k.replace("-", "_"): v if k!="passwd" else "******" for k, v in dic.items()}
    dic2.update(kwargs)
    return dic2

class TestCliArgs(unittest.TestCase):

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
    job_c = {
        "job-name": "my-job-name",
        "image": "my-docker-image",
        "cluster-alias": "cluster-for-test",
        "workspace": "/user/myuser",
    }

    def test_cluster(self):
        alias = self.cluster_ut["cluster-alias"]
        # test for command `opai cluster add` and `opai cluster list`
        run_command("opai unset cluster-alias")
        run_test_command("opai cluster add", self.cluster_ut)
        cluster_bk = EngineRelease().process(['cluster', 'list'])[alias]
        expectedOutput = gen_expected(self.cluster_ut)
        expectedOutput["storages"] = []
        self.assertDictEqual(expectedOutput, cluster_bk)

        # test for command `opai cluster attach-hdfs`
        with self.assertRaises(CalledProcessError):
            run_test_command("opai cluster attach-hdfs", self.hdfs_ut)
        run_test_command("opai cluster attach-hdfs -a %s" % alias, self.hdfs_ut)
        cluster_bk = EngineRelease().process(['cluster', 'list'])[alias]
        expectedOutput["storages"].append(gen_expected(self.hdfs_ut, user="myuser", protocol="webHDFS"))
        self.assertDictEqual(expectedOutput, cluster_bk)

    def test_job(self):
        alias = self.cluster_ut["cluster-alias"]
        # cluster delete
        run_test_command("opai cluster delete", {}, alias)
        clusters = EngineRelease().process(['cluster', 'list'])
        self.assertFalse(alias in clusters)
        run_command("opai unset cluster-alias")

        # `opai job sub` with incompleted args
        for k in self.job_c.keys():
            print("test sub command without flag --%s" % k)
            self.run_test_sub(self.job_c, "ls", ignore_job_c=[k])

        # `opai job sub`
        self.job_c["gpu"] = 1
        rmtree(os.path.dirname(self.job_cfg_file), ignore_errors=True)
        self.run_test_sub(self.job_c, "ls", error_expected=False)
        job_config = from_file(self.job_cfg_file)
        self.assertListEqual(job_config['extras']["__clusters__"], [])
        self.assertEqual(self.job_c["gpu"], job_config["taskRoles"][0]["gpuNumber"])

        # `cluster add` + `cluster select` + `cluster attach-hdfs` + `job sub`
        rmtree(os.path.dirname(self.job_cfg_file), ignore_errors=True)
        run_commands(
            get_cmd('opai cluster add', self.cluster_ut),
            get_cmd('opai cluster select %s' % alias, {}),
            get_cmd("opai cluster attach-hdfs", self.hdfs_ut),
            get_cmd("opai job sub --preview", self.job_c, "ls")
        )
        defaults = EngineRelease().process(['set'])
        self.assertEqual(defaults["cluster-alias"], alias)
        job_config = from_file(self.job_cfg_file)
        self.assertEqual(alias, job_config["extras"]["__clusters__"][0]["cluster_alias"])

        job_config2 = EngineRelease().process(['job', 'submit', '--preview', self.job_cfg_file])
        self.assertDictEqual(job_config, job_config2)

    @property
    def job_cfg_file(self):
        return Job.get_config_file(Namespace(job_name=self.job_c["job-name"], v2=False))


    def run_test_sub(self, job_c: dict, user_cmd, error_expected: bool=True, ignore_job_c: list=[]):
            rmtree(os.path.join(".openpai", "jobs", job_c["job-name"]), ignore_errors=True)
            flags = {k: v for k, v in job_c.items() if k not in ignore_job_c}
            if error_expected:
                with self.assertRaises(CalledProcessError):
                    run_test_command("opai job sub --preview", flags, user_cmd)
            else:
                run_test_command("opai job sub --preview", flags, user_cmd)