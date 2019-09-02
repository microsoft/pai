import unittest
import os
from copy import deepcopy
from subprocess import CalledProcessError
from openpaisdk import get_defaults, ClusterList, JobStatusParser
from openpaisdk.command_line import Engine
from openpaisdk.utils import run_command, randstr
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.io_utils import to_screen
from typing import Union
from basic_test import OrderedUnitTestCase, seperated


def get_cmd(cmd: Union[str, list], flags: dict, args: Union[list, str] = None):
    lst = []
    lst.extend(cmd if isinstance(cmd, list) else cmd.split())
    for flag, value in flags.items():
        lst.extend(["--" + flag, value.__str__()])
    if args:
        lst.extend(args if isinstance(args, list) else args.split())
    return lst


def run_commands(*cmds, sep: str = '&&'):
    lst = []
    for i, c in enumerate(cmds):
        lst.extend(c)
        if i != len(cmds) - 1:
            lst.append(sep)
    run_command(lst)


def run_test_command(cmd: Union[str, list], flags: dict, args: Union[list, str] = None):
    run_command(get_cmd(cmd, flags, args))


def gen_expected(dic: dict, **kwargs):
    dic2 = {k.replace("-", "_"): v if k != "password" else "******" for k, v in dic.items()}
    dic2.update(kwargs)
    return dic2


class TestCommandLineInterface(OrderedUnitTestCase):

    ut_init_shell = os.path.join('..', 'ut_init.sh')

    def step1_init_clusters(self):
        to_screen("""\
testing REST APIs related to retrieving cluster info, including
- rest_api_cluster_info
- rest_api_user
- rest_api_token
- rest_api_virtual_clusters
        """)
        with open(self.ut_init_shell) as fn:
            for line in fn:
                if line.startswith('#'):
                    continue
                self.cmd_exec(line)
        alias = get_defaults()["cluster-alias"]
        self.assertTrue(alias, "not specify a cluster")

    def step2_submit_job(self):
        import time
        to_screen("""\
testing REST APIs related to submitting a job, including
- rest_api_submit
        """)
        self.job_name = 'ut_test_' + randstr(10)
        self.cmd_exec(['opai', 'job', 'sub', '-i', 'python:3', '-j', self.job_name, 'opai cluster resources'])
        time.sleep(10)

    def step3_job_monitoring(self):
        to_screen("""\
testing REST APIs related to querying a job, including
- rest_api_job_list
- rest_api_job_info
        """)
        client = ClusterList().load().get_client(get_defaults()["cluster-alias"])
        self.cmd_exec(['opai', 'job', 'list'])
        job_list = client.rest_api_job_list(client.user)  # ! only jobs from current user to reduce time
        job_list = [job['name'] for job in job_list]
        assert self.job_name in job_list, job_list
        to_screen(f"testing job monitoring with {self.job_name}")
        status = client.rest_api_job_info(self.job_name)
        to_screen(f"retrieving job status and get its state {JobStatusParser.state(status)}")
        config = client.rest_api_job_info(self.job_name, 'config')
        to_screen("retrieving job config")
        logs = JobStatusParser.all_tasks_logs(status)
        assert logs, f"failed to read logs from status \n{status}"
        for k, v in logs.items():
            for t, content in v.items():
                to_screen(f"reading logs {k} for {t} and get {len(content)} Bytes")

    @seperated
    def test_commands_sequence(self):
        self.run_steps()

    job_c = {
        "job-name": "my-job-name",
        "image": "my-docker-image",
        "cluster-alias": "cluster-for-test",
        "workspace": "/user/myuser",
    }

    def xx_test_job(self):
        alias = self.cluster_ut["cluster-alias"]
        # cluster delete
        run_test_command("opai cluster delete", {}, alias)
        clusters = Engine().process(['cluster', 'list'])
        self.assertFalse(alias in clusters)
        run_command("opai unset cluster-alias")

        # `job submit`
        if os.path.isfile('mnist.yaml'):
            self.assertDictEqual(Engine().process(
                ['job', 'submit', '--preview', 'mnist.yaml']), from_file('mnist.yaml'))
            print("job submit test successfully")

        # `opai job sub` with incompleted args
        for k in self.job_c.keys():
            print("test sub command without flag --%s" % k)
            self.run_test_sub(self.job_c, "ls > /dev/null 2>&1", ignore_job_c=[k])

        # `opai job sub`
        self.job_c["gpu"] = 1
        rmtree(os.path.dirname(self.job_cfg_file), ignore_errors=True)
        self.run_test_sub(self.job_c, "ls", error_expected=False)
        job_config = from_file(self.job_cfg_file)
        return
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
        defaults = Engine().process(['set'])
        self.assertEqual(defaults["cluster-alias"], alias)
        job_config = from_file(self.job_cfg_file)
        self.assertEqual(alias, job_config["extras"]["__clusters__"][0]["cluster_alias"])

        job_config2 = Engine().process(['job', 'submit', '--preview', self.job_cfg_file])
        self.assertDictEqual(job_config, job_config2)

    @property
    def job_cfg_file(self):
        return Job.get_config_file(job_name=self.job_c["job-name"], v2=False)

    def run_test_sub(self, job_c: dict, user_cmd, error_expected: bool = True, ignore_job_c: list = []):
        rmtree(os.path.join(".openpai", "jobs", job_c["job-name"]), ignore_errors=True)
        flags = {k: v for k, v in job_c.items() if k not in ignore_job_c}
        if error_expected:
            with self.assertRaises(CalledProcessError):
                run_test_command("opai job sub --preview", flags, user_cmd)
        else:
            run_test_command("opai job sub --preview", flags, user_cmd)
