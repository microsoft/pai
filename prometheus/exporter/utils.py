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

import codecs
import subprocess

class Metric(object):
    """ represents one prometheus metric record
        https://prometheus.io/docs/concepts/data_model/ """

    def __init__(self, name, labels, value):
        self.name = name
        self.labels = labels
        self.value = value

    def __repr__(self):
        if len(self.labels) > 0:
            labels = ", ".join(map(lambda x: "{}=\"{}\"".format(x[0], x[1]),
                self.labels.items()))
            labels = "{" + labels + "}"
        else:
            labels = ""

        return "{}{} {}".format(self.name, labels, self.value)

def export_metrics_to_file(path, metrics):
    with codecs.open(path, "w", encoding="utf-8") as f:
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
    return "".join(outs), "".join(errs)
