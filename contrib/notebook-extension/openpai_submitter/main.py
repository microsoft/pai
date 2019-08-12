import threading as openpai_ext_threading
import json as openpai_ext_json

if 'openpai_ext_lock' not in vars():
    openpai_ext_buffer_lock = openpai_ext_threading.Lock()

class openpai_ext_Thread(openpai_ext_threading.Thread):
    '''
    In Javascript:
        Each time the code executed by Jupyter.notebook.kernel.execute gives output,
        the callback function in callbacks.iopub.output will receive message.

    In Python:
        We run python code in a new thread to avoid blocking the notebook.
        The handler is set to print json messages,
        thus the callback in javascript will get noticed.
    '''
    def success_handler(self, ret):
        openpai_ext_buffer_lock.acquire()
        print("__openpai${}__".format(self.token) + openpai_ext_json.dumps(
            {
                'code': 0,
                'message': ret,
            }
        ))
        openpai_ext_buffer_lock.release()

    def err_handler(self, e):
        openpai_ext_buffer_lock.acquire()
        print("__openpai${}__".format(self.token) + openpai_ext_json.dumps(
            {
                'code': -1,
                'message': str(e),
            }
        ))
        openpai_ext_buffer_lock.release()

    def __init__(self, target, token, args=[], kwargs={}):
        super(openpai_ext_Thread, self).__init__()
        self.target = target
        self.token = token
        self.args = args
        self.kwargs = kwargs

    def run(self):
        try:
            ret = self.target(*self.args, **self.kwargs)
            self.success_handler(ret)
        except Exception as e:
            self.err_handler(e)

class openpai_ext_Interface(object):

    def __init__(self):
        from openpaisdk import __cluster_config_file__ as openpai_ext_config
        from openpaisdk.io_utils import from_file as openpai_ext_from_file
        from openpaisdk.cluster import ClusterList as openpai_ext_ClusterList
        self.cll = openpai_ext_ClusterList(
            openpai_ext_from_file(openpai_ext_config, default=[])
        )

    def execute(self, target, token, args=[], kwargs={}):
        t = openpai_ext_Thread(target, token, args, kwargs)
        t.start()

    def available_resources(self, token):
        self.execute(self.cll.available_resources, token)

    def __zip_and_upload_helper(self, ctx):
        import shutil
        import tempfile
        import os
        import uuid
        import time
        
        client = self.cll.get_client(ctx["cluster"])
        ctx['user'] = client.user

        filename = os.path.join(
              tempfile.gettempdir(),
              str(uuid.uuid1())
            )

        filename = shutil.make_archive(filename, 'zip', '.')

        storage = client.get_storage()

        remote_filename = storage.upload(filename, '/OpenPAI_submitter/{}/{}/{}'.format(
            ctx["user"],
            time.strftime("%y%m%d-%H%M%S"),
            os.path.basename(filename))
        )

        assert remote_filename is not None

        ctx['code_archive'] = remote_filename

        return ctx

    def zip_and_upload(self, token, ctx):
        self.execute(self.__zip_and_upload_helper, token, args=[ctx])

    def __submit_job_helper(self, ctx):
        '''
        if ctx["type"] == quick => submit it 
        if ctx["type"] == edit => generate job config
        '''
        import tempfile
        from openpaisdk.core import Job
        import os
        import sys

        ctx['code_basename'] = os.path.basename(ctx['code_archive'])

        commands = [
            'apt-get update',
            'apt-get -y install unzip openjdk-8-jdk',
            'pip install -U pip',
            'pip install jupyter',
            'mkdir -p /install /code',
            'wget  https://www-us.apache.org/dist/hadoop/common/hadoop-2.7.7/hadoop-2.7.7.tar.gz -O /install/hadoop.tar.gz',
            'cd /install && tar -zxf hadoop.tar.gz',
            'export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which javac))))',
            '/install/hadoop-2.7.7/bin/hdfs dfs -copyToLocal  ${{PAI_DEFAULT_FS_URI}}{} /code'.format(ctx['code_archive']),
            'cd /code',
            'unzip {}'.format(ctx['code_basename']),
            'rm {}'.format(ctx['code_basename']),
        ]
        if ctx['form'] == 'file':  # submit as a .py file
            commands.extend([
                'jupyter nbconvert --to script {} --output openpai_submitter_entry'.format(ctx['notebook_name']),
                'python openpai_submitter_entry.py'
            ])
        else:
            commands.extend([
                'jupyter-notebook  --no-browser --ip 0.0.0.0 --allow-root',
            ])

        resources = {"ports": {}, "gpu": int(ctx['gpu']), "cpu": int(ctx['cpu']), "memoryMB": int(ctx['memoryMB'])}

        if ctx['form'] == 'file':
            jobname = 'python_' + tempfile.mkdtemp()[-8:]
        else:
            jobname = 'jupyter_' + tempfile.mkdtemp()[-8:]

        job = Job(jobname)
        job.protocol['defaults']['virtualCluster'] = ctx['vc']
        if ctx['type'] == 'quick':
            ctx['joblink'] = job.one_liner(
                commands,
                ctx['docker_image'],
                {"cluster_alias": ctx['cluster']},
                resources,
                True
            )
        else:
            ctx['job_config'] = job.one_liner(
                commands,
                ctx['docker_image'],
                {"cluster_alias": ctx['cluster']},
                resources,
                False
            )
        ctx['jobname'] = jobname

        return ctx

    def submit_job(self, token, ctx):
        self.execute(self.__submit_job_helper, token, args=[ctx])

    def __detect_notebook_helper(self, ctx):
        import requests
        import time
        import re
        client = self.cll.get_client(ctx['cluster'])
        states_successful, states_failed, states_unfinished = [
            "SUCCEEDED"], ["FAILED"], ["WAITING", "RUNNING", "COMPLETING"]
        count = 0
        while True:
            count += 1
            if count > 180:
                raise Exception('Timeout error!')
            info = client.jobs(ctx['jobname'])
            state = info['jobStatus']['state']
            if state in states_failed:
                raise Exception("The job has failed. Please refer to the job link for details: <a href=\"{}\" target=\"_blank\" >{}</a>"
                                .format(ctx['joblink'], ctx['joblink']))
            elif state in states_successful:
                raise Exception("The job has completed unexpectedly. Please refer to the job link for details: <a href=\"{}\" target=\"_blank\">{}</a>"
                                .format(ctx['joblink'], ctx['joblink']))
            elif state == 'RUNNING':
                log_path = info['taskRoles']['main']['taskStatuses'][0]['containerLog'] + 'user.pai.stderr?start=-8192'
                ip = info['taskRoles']['main']['taskStatuses'][0]['containerIp']
                html = requests.get(log_path).text
                if html.find('The Jupyter Notebook is running at') != -1:
                    url = re.findall('or (http://127.0.0.1:.*)', html)[0].strip().replace('127.0.0.1', ip)
                    ctx['notebook_url'] = url
                    return ctx
            else:
                pass
            time.sleep(10)

    def detect_notebook(self, token, ctx):
        self.execute(self.__detect_notebook_helper, token, args=[ctx])

    def __detect_jobs_helper(self, jobs_ctx):
        import requests
        import time
        import re
        ret = []
        for ctx in jobs_ctx:
            try:
                client = self.cll.get_client(ctx['cluster'])
                states_successful, states_failed, states_unfinished = [
                    "SUCCEEDED"], ["FAILED"], ["WAITING", "RUNNING", "COMPLETING"]
                info = client.jobs(ctx['jobname'])
                state = info['jobStatus']['state']
                if state != 'RUNNING':
                    notebook_url = '-'
                else:
                    log_path = info['taskRoles']['main']['taskStatuses'][0]['containerLog'] + 'user.pai.stderr?start=-8192'
                    ip = info['taskRoles']['main']['taskStatuses'][0]['containerIp']
                    html = requests.get(log_path).text
                    if html.find('The Jupyter Notebook is running at') != -1:
                        notebook_url = re.findall('or (http://127.0.0.1:.*)', html)[0].strip().replace('127.0.0.1', ip)
                    else:
                        notebook_url = '-'
                ctx['state'] = state
                ctx['notebook_url'] = notebook_url
            except Exception as e:
                ctx['state'] = '<span title="{}">UNKNOWN</span>'.format(e)
                ctx['notebook_url'] = '-'
            finally:
                ret.append(ctx)
        return ret

    def detect_jobs(self, token, jobs_ctx):
        self.execute(self.__detect_jobs_helper, token, args=[jobs_ctx])


openpai_ext_interface = openpai_ext_Interface()