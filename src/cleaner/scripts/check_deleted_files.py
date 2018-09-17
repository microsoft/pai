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

import multiprocessing
from cleaner.utils import common

logger = multiprocessing.get_logger()


def list_and_check_files(arg):
    files = common.run_cmd("source ./scripts/list_deleted_files.sh 2>/dev/null", logger)
    if len(files) <= 1:
        logger.info("no deleted files found.")
    else:
        # skip the field names from the command
        files = files[1:]

    for f in files:
        f_fields = f.split(" ")
        logger.warning("process [%s] opened file [%s] but the file has been deleted.", f_fields[0], f_fields[1])


def main():
    common.setup_logging()
    logger.info("start to check the deleted files opened by each running process.")
    list_and_check_files(None)


if __name__ == "__main__":
    main()
