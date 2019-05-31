import unittest
import os
from copy import deepcopy
from subprocess import CalledProcessError
from shutil import rmtree
from openpaisdk.command_line import EngineRelease
from openpaisdk.utils import run_command, find_match
from openpaisdk.job import Job, Namespace, from_file


def run_test_command(cmd: str, flags: dict, args: str=""):
    run_command(" ".join([cmd] + ["--%s %s" % (k, v) for k, v in flags.items()] + [args]))


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

    def test_job(self):
        job_c = {
            "job-name": "my-job-name",
            "image": "my-docker-image",
            "cluster-alias": "cluster-for-test",
            "workspace": "/user/myuser",
        }
        for k in job_c.keys():
            print("test sub command without flag --%s" % k)
            self.run_test_sub(job_c, "ls", ignore_job_c=[k]) # args uncompleted
        job_c["gpu"] = 1
        self.run_test_sub(job_c, "ls", error_expected=False)
        job_config = from_file(Job.get_config_file(Namespace(job_name=job_c["job-name"], v2=False)))
        self.assertEqual(job_c["gpu"], job_config["taskRoles"][0]["gpuNumber"])

    def run_test_sub(self, job_c: dict, user_cmd, error_expected: bool=True, ignore_job_c: list=[]):
            rmtree(os.path.join(".openpai", "jobs", job_c["job-name"]), ignore_errors=True)
            flags = {k: v for k, v in job_c.items() if k not in ignore_job_c}
            if error_expected:
                with self.assertRaises(CalledProcessError):
                    run_test_command("opai job sub --preview", flags, user_cmd)
            else:
                run_test_command("opai job sub --preview", flags, user_cmd)