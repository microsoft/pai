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
from openpaisdk import get_defaults, ClusterList, JobStatusParser
from openpaisdk.utils import run_command, randstr
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
        self.cmd_exec('opai cluster resources')

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
        client.rest_api_job_info(self.job_name, 'config')
        to_screen("retrieving job config")
        logs = JobStatusParser.all_tasks_logs(status)
        assert logs, f"failed to read logs from status \n{status}"
        for k, v in logs.items():
            for t, content in v.items():
                to_screen(f"reading logs {k} for {t} and get {len(content)} Bytes")

    @seperated
    def test_commands_sequence(self):
        self.run_steps()
