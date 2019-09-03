import threading as openpai_ext_threading
import json as openpai_ext_json
from openpaisdk import __flags__ as openpai_ext_flags

openpai_ext_flags.disable_to_screen = True

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
        ), flush=True)
        openpai_ext_buffer_lock.release()

    def err_handler(self, e):
        openpai_ext_buffer_lock.acquire()
        print("__openpai${}__".format(self.token) + openpai_ext_json.dumps(
            {
                'code': -1,
                'message': str(e),
            }
        ), flush=True)
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
            import traceback
            self.err_handler(traceback.format_exc())


class openpai_ext_Interface(object):

    def __init__(self):
        from openpaisdk import LayeredSettings, ClusterList
        if LayeredSettings.get('container-sdk-branch') != 'notebook-extension':
            LayeredSettings.update('user_basic', 'container-sdk-branch', 'notebook-extension')
        self.cll = ClusterList().load()

    def execute(self, target, token, args=[], kwargs={}):
        t = openpai_ext_Thread(target, token, args, kwargs)
        t.start()

    def tell_resources(self, token):
        self.execute(self.cll.tell, token)

    def available_resources(self, token):
        self.execute(self.cll.available_resources, token)

    def read_defaults(self, token):
        def _read_defaults_helper():
            from openpaisdk import LayeredSettings
            from openpaisdk.job import JobResource
            return {
                'image-list': LayeredSettings.get('image-list'),
                'resource-list': JobResource.parse_list(LayeredSettings.get('resource-list'))
            }

    def __submit_job_helper(self, ctx):
        import tempfile
        from openpaisdk import Job
        import os
        import sys
        from openpaisdk.notebook import get_notebook_path
        from openpaisdk import LayeredSettings
        import yaml

        # setting layers description
        # layer name     | from                                 : priority
        # user_advanced  | NotebookConfiguration.set            : 0
        # user_basic     | extension panel selection            : 1
        # local_default  | deaults in .openpai/defaults.yaml    : 2
        # global_default | defaults in ~/.openpai/defaults.yaml : 3
        # -              | predefined in flags.py               : 4
        LayeredSettings.update("user_basic", "cluster-alias", ctx['cluster'])
        LayeredSettings.update("user_basic", "virtual-cluster", ctx['vc'])
        LayeredSettings.update("user_basic", "image", ctx['docker_image'])
        LayeredSettings.update("user_basic", "cpu", ctx['cpu']),
        LayeredSettings.update("user_basic", "gpu", ctx['gpu']),
        LayeredSettings.update("user_basic", "memoryMB", ctx['memoryMB'])

        cfgs = LayeredSettings.as_dict()

        notebook_path = get_notebook_path()
        _, _, sources = next(os.walk('.'))

        if ctx['form'] == 'file':
            jobname = 'python_' + tempfile.mkdtemp()[-8:]
            mode = 'script'
        elif ctx['form'] == 'notebook':
            jobname = 'jupyter_' + tempfile.mkdtemp()[-8:]
            mode = 'interactive'
        else:
            jobname = 'silent_' + tempfile.mkdtemp()[-8:]
            mode = 'silent'

        job = Job(jobname)\
            .from_notebook(
                nb_file=get_notebook_path(),
                cluster={
                    'cluster_alias': cfgs['cluster-alias'],
                    'virtual_cluster': cfgs['virtual-cluster'],
                    'workspace': cfgs['workspace'],
                },
                mode=mode,
                **{
                    'token': '',
                    'image': cfgs["image"],
                    'resources': {
                        'cpu': cfgs["cpu"],
                        'gpu': cfgs["gpu"],
                        'memoryMB': cfgs["memoryMB"],
                        'mem': cfgs['mem']
                    },
                    'sources': sources + cfgs["sources"],
                    'pip_installs': cfgs["pip-installs"],
                }
        )
        ctx['job_config'] = yaml.dump(job.get_config(), default_flow_style=False)
        ctx['jobname'] = job.name
        if ctx['type'] == 'quick':
            ret = job.submit()
            ctx['joblink'] = ret['job_link']
            ctx['jobname'] = ret['job_name']
        return ctx

    def submit_job(self, token, ctx):
        self.execute(self.__submit_job_helper, token, args=[ctx])

    def __wait_jupyter_helper(self, ctx):
        from openpaisdk import Job
        job = Job(ctx['jobname']).load(cluster_alias=ctx['cluster'])
        ret = job.wait()
        ret = job.connect_jupyter()  # ret will be None if run in silent mode and without this
        ctx['state'] = ret['state']
        if ret['notebook'] is None:
            ctx['notebook_url'] = '-'
        else:
            ctx['notebook_url'] = ret['notebook']
        return ctx

    def wait_jupyter(self, token, ctx):
        self.execute(self.__wait_jupyter_helper, token, args=[ctx])

    def __detect_jobs_helper(self, jobs_ctx):
        from openpaisdk import Job
        ret = []
        for ctx in jobs_ctx:
            try:
                job = Job(ctx['jobname']).load(cluster_alias=ctx['cluster'])
                job_info = job.connect_jupyter()
                ctx['state'] = job_info['state']
                ctx['notebook_url'] = job_info['notebook']
                if ctx['notebook_url'] is None:
                    ctx['notebook_url'] = '-'
            except Exception as e:
                ctx['state'] = '<span title="{}">UNKNOWN</span>'.format(e)
                ctx['notebook_url'] = '-'
            finally:
                ret.append(ctx)
        return ret

    def detect_jobs(self, token, jobs_ctx):
        self.execute(self.__detect_jobs_helper, token, args=[jobs_ctx])


openpai_ext_interface = openpai_ext_Interface()
