from argparse import ArgumentParser, REMAINDER
import json, yaml
import os
import uuid
from openpaisdk import __default_config__, __install__
from openpaisdk.core import Client, Job
from subprocess import check_call



def pprint(s, fmt: str='yaml', **kwargs):
    if fmt == 'json':
        print(json.dumps(s, indent=4, **kwargs))
    if fmt == 'yaml':
        print(yaml.dump(s, default_flow_style=False))


class Action:

    def __init__(self, action: str, help_s: str, subparsers):
        self.action, self.help_s = action, help_s
        parser = subparsers.add_parser(action, help=help_s)
        self.define_arguments(parser)
    
    def define_arguments(self, parser):
        pass

    def do_action(self, args):
        raise NotImplementedError

    def get_client(self, args):
        self.client, self.alias = Client.from_json(args.json, args.alias)


class ActionCluster(Action):

    def __init__(self, subparsers):
        super().__init__('cluster', 'cluster management', subparsers)

    def define_arguments(self, parser):
        parser.add_argument('--name', help='show cluster alias only', action='store_true', default=False)

    def do_action(self, args):
        with open(args.json) as fn:
            cfgs = json.load(fn)
        for v in cfgs.values():
            v['passwd'] = "******"
        return cfgs[args.alias] if args.alias else list(cfgs.keys()) if args.name else cfgs


class ActionJobs(Action):

    def __init__(self, subparsers):
        super().__init__('jobs', 'query jobs', subparsers)
    
    def define_arguments(self, parser):
        parser.add_argument('job_name', metavar='job name', nargs='?')
        parser.add_argument('query', nargs='?', choices=['config', 'ssh'])
        parser.add_argument('--name', help='show job name only', action='store_true', default=False)

    def do_action(self, args):
        self.get_client(args)
        result = self.client.rest_api_jobs(args.job_name, args.query)
        if args.name:
            assert not args.query, 'cannot use --name with query at the same time'
            result = [j['name'] for j in result]
        return result       


class ActionSubmit(Action):

    def __init__(self, subparsers):
        super().__init__('submit', 'submit a simple job', subparsers)
    
    def define_arguments(self, parser): 
        parser.add_argument('--config', help='job config file')
        parser.add_argument('--pip', '-p', help='packages to be installed via pip')
        parser.add_argument('--file', '-f', help='source files to be uploaded')
        parser.add_argument('--disable-install-sdk', '-d', action='store_true', default=False, help='disable parserenpai sdk')
        parser.add_argument('--gpu', help='number of gpus')
        parser.add_argument('--mem', help='number of memories #MB')
        parser.add_argument('--cpu', help='number of cpus')
        parser.add_argument('--job-name', '-j', help='job name', default=None)
        parser.add_argument('--image', '-i', help='docker image')
        parser.add_argument('commands', nargs=REMAINDER, help='command to run in openpai')

    def do_action(self, args):
        self.get_client(args)
        job_name = args.job_name if args.job_name else uuid.uuid4().hex
        job_dir = '/user/{}/jobs/{}'.format(self.client.user, job_name)
        if args.commands[0] in ['python', 'python3', 'bash', 'sh'] and not args.commands[1].startswith('-'):
            sources = [args.commands[1]]
        pip_requirements = [__install__]
        command = ' && '.join(['cd code', ' '.join(args.commands)])
        job = Job.simple(
            job_name, args.image, command, 
            job_dir = job_dir,
            sources = sources, 
            pip_requirements = pip_requirements
            )
        self.client.get_token().submit(job)
        return self.client.get_job_link(job_name)


def main():
    parser = ArgumentParser(description='command line interface for OpenPAI')
    parser.add_argument('--json', help='openpai config json file', default=__default_config__)
    parser.add_argument('--alias', '-a', help='cluster alias to use')

    subparsers = parser.add_subparsers(dest='action', help='openpai sub-commands')
    cls_list = [ActionCluster, ActionJobs, ActionSubmit]
    obj_list = [c(subparsers) for c in cls_list]
    dic = {c.action: c for c in obj_list}

    args = parser.parse_args()
    try:
        pprint(dic[args.action].do_action(args))
    except Exception as identifier:
        print(identifier)

if __name__ == '__main__':
    main()
