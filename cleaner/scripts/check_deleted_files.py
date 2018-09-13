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

import psutil
import multiprocessing
import os

logger = multiprocessing.get_logger()


def list_and_check_files(arg):
    for proc in psutil.process_iter():
        check_deleted_files(proc)


def check_deleted_files(proc):
    if proc is None:
        return
    try:
        for file in proc.open_files():
            if file.path and not os.path.exists(file.path):
                # Currently we only print warnings in log file. In the future we will expose metrics to Prometheus
                logger.warn("process %s opened file %s but the file has been deleted.", proc.pid, file.path)
    except psutil.Error as e:
        logger.error("cannot check deleted files for process %s.", proc.pid)
        logger.exception(e)


def main():
    logger.info("start to check the deleted files opened by each running process.")
    list_and_check_files()


if __name__ == "__main__":
    main()
