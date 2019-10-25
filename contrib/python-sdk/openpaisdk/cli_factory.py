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


import argparse
from openpaisdk.io_utils import to_screen
from openpaisdk.job import Job
from openpaisdk.cluster import ClusterList


class ArgumentError(Exception):

    pass


class Action:

    def __init__(self, action: str, help_s: str):
        self.action, self.help_s = action, help_s

    def define_arguments(self, parser: argparse.ArgumentParser):
        pass

    def check_arguments(self, args):
        pass

    def restore(self, args):
        pass

    def store(self, args):
        pass

    def do_action(self, args):
        raise NotImplementedError


class ActionFactory(Action):

    def __init__(self, action: str, allowed_actions: dict):
        assert action in allowed_actions, ("unsupported action of job", action)
        super().__init__(action, allowed_actions[action])
        suffix = action.replace('-', '_')
        for attr in ["define_arguments", "check_arguments", "do_action"]:
            if hasattr(self, f"{attr}_{suffix}"):
                setattr(self, attr, getattr(self, f"{attr}_{suffix}"))
            else:
                assert attr != "do_action", f"must specify a method named {attr}_{suffix} in {self.__class__.__name__}"

        self.__job__ = Job()
        self.__clusters__ = ClusterList()
        self.enable_svaing = dict(job=False, clusters=False)

    def restore(self, args):
        if getattr(args, 'job_name', None):
            self.__job__.load(job_name=args.job_name)
        self.__clusters__.load()
        return self

    def store(self, args):
        if self.enable_svaing["job"]:
            self.__job__.save()
        if self.enable_svaing["clusters"]:
            self.__clusters__.save()
        return self


class Scene:

    def __init__(self, scene: str, help_s: str, parser: argparse.ArgumentParser,
                 action_list  # type: list[Action]
                 ):
        self.scene, self.help_s = scene, help_s
        self.single_action = len(action_list) == 1 and scene == action_list[0].action
        if self.single_action:
            self.actor = action_list[0]
            self.actor.define_arguments(parser)
        else:
            self.actions, subparsers = dict(), parser.add_subparsers(dest='action', help=help_s)
            for a in action_list:
                p = subparsers.add_parser(a.action, help=a.help_s)
                a.define_arguments(p)
                self.actions[a.action] = a

    def process(self, args):
        actor = self.actor if self.single_action else self.actions[args.action]
        actor.check_arguments(args)
        actor.restore(args)
        result = actor.do_action(args)
        actor.store(args)
        return result


class EngineFactory:

    def __init__(self, cli_structure):
        self.parser = argparse.ArgumentParser(
            description='command line interface for OpenPAI',
            formatter_class=argparse.ArgumentDefaultsHelpFormatter
        )
        subparsers = self.parser.add_subparsers(
            dest='scene',
            help='openpai cli working scenarios',
        )
        self.scenes = dict()
        for k, v in cli_structure.items():
            p = subparsers.add_parser(k, help=v[0])
            self.scenes[k] = Scene(k, v[0], p, v[1])

    def process(self, a: list):
        to_screen(f'Received arguments {a}', _type="debug")
        args = self.parser.parse_args(a)
        return self.process_args(args)

    def process_args(self, args):
        to_screen(f'Parsed arguments {args}', _type="debug")
        if not args.scene:
            self.parser.print_help()
            return
        return self.scenes[args.scene].process(args)
