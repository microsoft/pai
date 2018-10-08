#!/usr/bin/env python
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

import re
import codecs
import subprocess

import logging
import threading
import datetime
from Queue import Queue
from Queue import Empty

logger = logging.getLogger(__name__)

class Metric(object):
    """ represents one prometheus metric record
        https://prometheus.io/docs/concepts/data_model/ """

    def __init__(self, name, labels, value):
        self.name = name
        self.labels = labels
        self.value = value

    def __eq__(self, o):
        return self.name == o.name and self.labels == o.labels and self.value == o.value

    def __repr__(self):
        if len(self.labels) > 0:
            labels = ", ".join(map(lambda x: "{}=\"{}\"".format(x[0], x[1]),
                self.labels.items()))
            labels = "{" + labels + "}"
        else:
            labels = ""

        return "{}{} {}".format(self.name, labels, self.value)


def export_metrics_to_file(path, metrics):
    """ if metrics not None, should still open the path, to modify time stamp of file,
    readiness probe needs this"""
    with codecs.open(path, "w", encoding="utf-8") as f:
        if metrics is not None:
            for metric in metrics:
                f.write(str(metric))
                f.write("\n")


def check_output(*args, **kwargs):
    """ subprocess.check_output may hanging if cmd output too much stdout or stderr """
    kwargs["stdout"] = subprocess.PIPE
    kwargs["stderr"] = subprocess.PIPE
    process = subprocess.Popen(*args, **kwargs)
    outs = []
    errs = []

    while process.poll() is None:
        out, err = process.communicate()
        outs.append(out)
        errs.append(err)
    if process.returncode != 0:
        logger.warn("process `%s` failed with return code %d, stdout %s, stderr %s",
                args, process.returncode, "".join(outs), "".join(errs))
    return "".join(outs)


class Singleton(object):
    """ wrapper around gpu metrics getter, because getter may block
        indefinitely, so we wrap call in thread.
        Also, to avoid having too much threads, use semaphore to ensure only 1
        thread is running """
    def __init__(self, getter, get_timeout_s=3, old_data_timeout_s=60):
        self.getter = getter
        self.get_timeout_s = get_timeout_s
        self.old_data_timeout_s = datetime.timedelta(seconds=old_data_timeout_s)

        self.semaphore = threading.Semaphore(1)
        self.queue = Queue(1)
        self.old_metrics = None
        self.old_metrics_time = datetime.datetime.now()

    def try_get(self):
        if self.semaphore.acquire(False):
            def wrapper(semaphore, queue):
                """ wrapper assume semaphore already acquired, will release semaphore on exit """
                result = None

                try:
                    try:
                        # remove result put by previous thread but didn't get by main thread
                        queue.get(block=False)
                    except Empty:
                        pass

                    start = datetime.datetime.now()
                    result = self.getter()
                except Exception as e:
                    logger.warn("get gpu metrics failed")
                    logger.exception(e)
                finally:
                    logger.info("get gpu metrics spent %s", datetime.datetime.now() - start)
                    semaphore.release()
                    queue.put(result)

            t = threading.Thread(target=wrapper, name="gpu-metrices-getter",
                    args=(self.semaphore, self.queue))
            t.start()
        else:
            logger.warn("gpu-metrics-getter is still running")

        try:
            self.old_metrics = self.queue.get(block=True, timeout=self.get_timeout_s)
            self.old_metrics_time = datetime.datetime.now()
            return self.old_metrics
        except Empty:
            pass

        now = datetime.datetime.now()
        if now - self.old_metrics_time < self.old_data_timeout_s:
            return self.old_metrics

        logger.info("gpu info is too old")
        return None


def camel_to_underscore(label):
    """ convert camel case into underscore
    https://stackoverflow.com/a/1176023 """
    tmp = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', label)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', tmp).lower()


def walk_json_field_safe(obj, *fields):
    """ for example a=[{"a": {"b": 2}}]
    walk_json_field_safe(a, 0, "a", "b") will get 2
    walk_json_field_safe(a, 0, "not_exist") will get None
    """
    try:
        for f in fields:
            obj = obj[f]
        return obj
    except:
        return None
