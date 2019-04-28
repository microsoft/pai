from argparse import ArgumentParser, REMAINDER
import json
import os
import uuid
from openpaisdk import __default_config__, __install__
from openpaisdk.core import Client, Job
from subprocess import check_call



def pprint(s, indent: int=4, **kwargs):
    print(json.dumps(s, indent=indent, **kwargs))


def define_arguments_jobs(parser):
    parser.add_argument('job_name', metavar='job name', nargs='?')
    parser.add_argument('query', nargs='?', choices=['config', 'ssh'])
    parser.add_argument('--name', help='show job name only', action='store_true', default=False)
    return parser


def define_arguments_submit(parser):
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
    return parser


def define_arguments(parser: ArgumentParser):
    parser.add_argument('--json', '-j', help='openpai config json file', default=__default_config__)
    parser.add_argument('--alias', '-a', help='cluster alias to use')

    subparsers = parser.add_subparsers(dest='action', help='openpai sub-commands')
    define_arguments_jobs(subparsers.add_parser('jobs', help='query jobs'))
    define_arguments_submit(subparsers.add_parser('submit', help='submit a simple job'))


def process_command(args):
    client = Client.from_json(args.json, args.alias)

    if args.action == 'jobs':
        result = client.rest_api_jobs(args.job_name, args.query)
        if args.name:
            assert not args.query, 'cannot use --name with query at the same time'
            result = [j['name'] for j in result]
        pprint(result)
        return
    
    if args.action == 'submit':
        job_name = args.job_name if args.job_name else uuid.uuid4().hex
        job_dir = '/user/{}/jobs/{}'.format(client.user, job_name)
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
        client.get_token().submit(job)
        pprint(client.get_job_link(job_name))
        return


def main():
    parser = ArgumentParser(description='command line interface for OpenPAI')
    define_arguments(parser)
    args = parser.parse_args()
    try:
        process_command(args)
    except Exception as identifier:
        print(identifier)

if __name__ == '__main__':
    main()
