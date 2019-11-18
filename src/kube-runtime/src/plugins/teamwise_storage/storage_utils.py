# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import posixpath
import re


def get_nfs_setup_commands(server_config, mount_point, relative_path, phrase, user_name, job_name) -> list:
    if phrase == "pre_mount":
        return [
            "mkdir --parents {}".format(mount_point),
            "apt-get install --assume-yes nfs-common",
        ]
    if phrase == "tmp_mount" or phrase == "real_mount":
        server_type = server_config["type"]
        server_data = server_config["data"]
        rendered_path = render_path(posixpath.join(
            server_data["rootPath"], relative_path), user_name, job_name)
        return [
            "mkdir --parents {}".format(mount_point),
            "apt-get install --assume-yes cifs-utils",
        ]
    if phrase == "post_mount":
        return [
            "mkdir --parents {}".format(mount_point),
            "apt-get install --assume-yes cifs-utils",
        ]
    raise Exception("Unsupported phrase {}".format(phrase))


def render_path(ori_path, user_name, job_name) -> str:
    rendered_path = re.compile("%USER", re.IGNORECASE).sub(user_name, ori_path)
    rendered_path = re.compile("%JOB", re.IGNORECASE).sub(job_name, rendered_path)
    return posixpath.normpath(rendered_path)
