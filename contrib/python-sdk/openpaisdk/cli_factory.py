import argparse
from openpaisdk import __logger__
from openpaisdk.job import Job
from openpaisdk.core import ClusterList

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
        self.define_arguments = getattr(self, "define_arguments_" + suffix, super().define_arguments)
        self.check_arguments = getattr(self, "check_arguments_" + suffix, super().check_arguments)
        self.do_action = getattr(self, "do_action_" + suffix, None)
        self.__job__ = Job()
        self.__clusters__ = ClusterList()

    def restore(self, args):
        if getattr(args, 'job_name', None):
            self.__job__.load(job_name=args.job_name)
        self.__clusters__.load()
        return self

    def store(self, args):
        self.__job__.save()
        self.__clusters__.save()
        return self


class Scene:

    def __init__(self, scene: str, help_s: str, parser: argparse.ArgumentParser,
        action_list # type: list[Action]
        ):
        self.scene, self.help_s  = scene, help_s
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
        __logger__.debug('Parsed arguments to %s', args)
        actor = self.actor if self.single_action else self.actions[args.action]
        actor.check_arguments(args)
        actor.restore(args)
        result = actor.do_action(args)
        actor.store(args)
        return result


class EngineFactory:

    def __init__(self, cli_structure):
        self.parser = argparse.ArgumentParser(description='command line interface for OpenPAI')
        subparsers = self.parser.add_subparsers(dest='scene', help='openpai cli working scenarios')
        self.scenes = dict()
        for k, v in cli_structure.items():
            p = subparsers.add_parser(k, help=v[0])
            self.scenes[k] = Scene(k, v[0], p, v[1])

    def process(self, a: list):
        __logger__.debug('Received arguments %s', a)
        __logger__.debug("Received arguments %s", a)
        args = self.parser.parse_args(a)
        return self.process_args(args)

    def process_args(self, args):
        __logger__.debug("Parsed arguments %s", args)
        if not args.scene:
            raise ArgumentError
        return self.scenes[args.scene].process(args)