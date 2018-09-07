#!/usr/bin/python
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
import datetime
import os

def check_no_older_than(paths, delta):
    """ raise RuntimeError exception if any path in paths is older than `now - delta` """
    now = datetime.datetime.now()
    delta = datetime.timedelta(seconds=delta)
    oldest = now - delta

    for path in paths:
        mtime = os.path.getmtime(path)
        mtime = datetime.datetime.fromtimestamp(mtime)
        if oldest > mtime:
            raise RuntimeError("{} was updated more than {} seconds ago".format(path, delta))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", help="file to be checked")
    parser.add_argument("-d", "--delta", type=int, default=60, help="check file is no older than -d seconds")
    args = parser.parse_args()

    check_no_older_than(args.paths, args.delta)
