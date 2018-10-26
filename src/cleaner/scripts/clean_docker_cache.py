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

from cleaner.utils import common
import multiprocessing

logger = multiprocessing.get_logger()


def get_cache_size():
    out = common.run_cmd("source ./scripts/reclaimable_docker_cache.sh 2> /dev/null", logger)
    size = 0
    if len(out) == 0:
        logger.error("cannot retrieve cache size.")
        return size
    try:
        size = float(out[0])
    except ValueError:
        logger.error("cannot convert cache size, reset size to 0")
        size = 0
    return size


def check_and_clean(threshold):
    if get_cache_size() > threshold:
        # to avoid possible race condition, only clean the containers, images and networks created 1h ago
        common.run_cmd("docker system prune -af --filter until=1h", logger)


if __name__ == "__main__":
    common.setup_logging()
    check_and_clean(10)
