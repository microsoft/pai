"""this is the setup (install) script for OpenPAI notebook extension
"""
import os
import sys
from argparse import ArgumentParser
from subprocess import check_output


def run(cmds: list, comment: str = None):
    if comment:
        print(comment, flush=True)
    check_output(cmds, shell=True)


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--user', action='store_true', default=False, help='pip install in user mode')
    parser.add_argument('--ignore-sdk', '-i', action='store_true', default=False,
                        help='dont install python sdk, make sure you have a workable version instead')
    args = parser.parse_args()

    pip_cmd = [sys.executable, '-m', 'pip', 'install']
    if args.user:
        pip_cmd += ['--user']
    jupyter_cmd = [sys.executable, '-m', 'jupyter']

    run(
        pip_cmd + ['jupyter', 'jupyter_contrib_nbextensions'],
        '==== install requirements ===='
    )

    run(
        jupyter_cmd + ['contrib', 'nbextension', 'install', '--user'],
        '==== install nbextension ===='
    )

    if not args.ignore_sdk:
        run(
            pip_cmd + ['--upgrade', os.path.join('..', 'python-sdk')],
            '==== install sdk ===='
        )

    run(
        jupyter_cmd + ['nbextension', 'install', 'openpai_submitter'],
        '==== install openpai_submitter ===='
    )
    run(
        jupyter_cmd + ['nbextension', 'enable', 'openpai_submitter/main'],
        '==== enable openpai_submitter ===='
    )
