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

import subprocess
import multiprocessing
import logging
import sys
import os
import psutil
import signal


def kill_process_tree(pid, time_to_die, logger):
    """
    Kills a process and all its subprocesses in best effort.
    The processes are first killed by sending SIGTERM.
    If they cannot terminate in time_to_die seconds.
    They will be killed by sending SIGKILL.

    :param pid: id of process to be killed
    :param time_to_die: the time period in which the process should terminate
    :param logger: logger handler
    """
    if os.getpid() == pid:
        logger.error("I refuse to kill myself.")
        return

    try:
        process = psutil.Process(pid)
        processes = process.children(recursive=True)
        processes.append(process)
    except psutil.Error as e:
        logger.error("cannot get process %s and its subprocesses.", pid)
        logger.exception(e)
        return

    alive = kill_process_list(processes, signal.SIGTERM, time_to_die, logger)

    if alive:
        # the processes survive SIGTERM so try to kill them by SIGKILL
        alive = kill_process_list(alive, signal.SIGKILL, time_to_die, logger)
        if alive:
            for p in alive:
                logger.error("Process %s cannot be killed.", p.pid)


def kill_process_list(processes, sig, time_to_die, logger):
    def on_kill(proc):
        logger.info("process %s is killed, exit code %s", proc.pid, proc.returncode)

    for p in processes:
        kill_process(p, sig, logger)

    try:
        gone, alive = psutil.wait_procs(processes, timeout=time_to_die, callback=on_kill)
    except psutil.Error as e:
        logger.error("error to wait the processes to terminate.")
        logger.exception(e)
        alive = processes
    return alive


def kill_process(process, sig, logger):
    """
    kill a process by sending signal.

    :param process: process to kill
    :param sig: the signal
    :param logger: logger handler
    """
    try:
        logger.info("kill process %s by sending %s", process.pid, sig)
        os.kill(process.pid, sig)
    except Exception as e:
        logger.error("error to send %s to process %s.", sig, process.pid)
        logger.exception(e)


def run_cmd(cmd, logger):
    """
    Runs a given command and returns its output. If exceptions occur and the command process is still running.
    The command process and all its subprocesses will be terminated in best effort.

    :param cmd: the command to run
    :param logger: logger handler
    :return the output of the command
    """
    proc = subprocess.Popen(["/bin/bash", "-c", cmd], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    lines = []
    try:
        while True:
            line = proc.stdout.readline()
            if not line:
                break
            line = line.encode("UTF-8").strip()
            logger.info("output from command [%s] : %s", cmd, line)
            lines.append(line)
        proc.wait()
        if proc.returncode:
            logger.error("failed to run command %s, error code is %s", cmd, proc.returncode)
    finally:
        if proc.poll() is None:
            # the process is till running and terminate it before exit
            logger.error("process %s is not completed and will terminate it before exit.", proc.pid)
            kill_process_tree(proc.pid, 2, logger)

    return lines


def setup_logging():
    logger = multiprocessing.get_logger()
    if len(logger.handlers) == 0:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
