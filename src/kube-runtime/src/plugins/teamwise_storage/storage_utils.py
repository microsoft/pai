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


def is_valid_storage_config(user_storage_config, storage_config_names) -> bool:
    for storage_config in storage_config_names:
        if storage_config not in user_storage_config:
            return False
    return True


def perpare_server_mount_dict(storage_configs) -> dict:
    server_mount_dict = {}
    for config in storage_configs:
        for mount_info in config["mountInfos"]:
            if mount_info["server"] in server_mount_dict:
                server_mount_dict[mount_info["server"]].append(mount_info)
            else:
                server_mount_dict[mount_info["server"]] = [mount_info]
    return server_mount_dict


def validate_mount_point(mount_points, mount_infos) -> None:
    for moun_info in mount_infos:
        # Check duplicated mount points
        if moun_info["mountPoint"] in mount_points:
            raise Exception(
                "Mount point error! More than one mount point [" +
                moun_info["mountPoint"] + "]!")
        mount_points.append(moun_info["mountPoint"])


def get_setup_command(server_config, mount_point, phrase, user_name, job_name, relative_path="") -> list:
    server_type = server_config["type"]
    if server_type == "nfs":
        return __get_nfs_setup_commands(server_config, mount_point, relative_path, phrase, user_name, job_name)
    if server_type == "samba":
        return __get_samba_setup_commands(server_config, mount_point, relative_path, phrase, user_name, job_name)


def generate_make_tmp_folder_command(tmp_folder, mount_infos, user_name, job_name) -> list:
    mkdir_commands = list(map(lambda mount_info: [
        "mkdir --parents {}".format(
            posixpath.normpath(mount_info["mountPoint"])),
        "mkdir --parents {}".format(__render_path(posixpath.join(tmp_folder, mount_info["path"]),
                                                  user_name, job_name))], mount_infos))
    mkdir_commands = [
        command for mkdir_command in mkdir_commands for command in mkdir_command]
    return mkdir_commands


def __get_nfs_setup_commands(server_config, mount_point, relative_path, phrase, user_name, job_name) -> list:
    if phrase == "pre_mount":
        return [
            "mkdir --parents {}".format(mount_point),
            "apt-get install --assume-yes nfs-common",
        ]
    if phrase == "tmp_mount" or phrase == "real_mount":
        server_data = server_config["data"]
        rendered_path = __render_path(posixpath.join(
            server_data["rootPath"], relative_path), user_name, job_name)
        return [
            "mount -t nfs4 {}:"
            .format(posixpath.normpath(server_data["address"])) + rendered_path + " {}"
            .format(mount_point)
        ]
    if phrase == "post_mount":
        return ["umount -l {}".format(mount_point), "rm -r {}".format(mount_point)]
    raise Exception("Unsupported phrase {}".format(phrase))


def __get_samba_setup_commands(server_config, mount_point, relative_path, phrase, user_name, job_name) -> list:
    if phrase == "pre_mount":
        return [
            "mkdir --parents {}".format(mount_point),
            "apt-get install --assume-yes cifs-utils",
        ]
    if phrase == "tmp_mount" or phrase == "real_mount":
        server_data = server_config["data"]
        rendered_path = __render_path(posixpath.join(
            server_data["rootPath"], relative_path), user_name, job_name)
        domain = ""
        if server_data["domain"]:
            domain = ",domain={}".format(server_data["domain"])
        return [
            "mount -t cifs //{}"
            .format(server_data["address"]) + rendered_path + " {}"
            .format(mount_point) + " -o vers=3.0,username={},password={}"
            .format(server_data["userName"], server_data["password"]) + domain
        ]
    if phrase == "post_mount":
        return ["umount -l {}".format(mount_point), "rm -r {}".format(mount_point)]
    raise Exception("Unsupported phrase {}".format(phrase))


def __get_azurefile_setup_commands(server_config, mount_point, relative_path, phrase, user_name, job_name) -> list:
    server_data = server_config["data"]
    if phrase == "pre_mount":
        ret = [
            "mkdir --parents {}".format(mount_point),
            "apt-get install --assume-yes cifs-utils",
        ]
        if server_data["proxy"] and len(server_data["proxy"]) == 2:
            ret.append("apt-get install --assume-yes sshpass")
            # TODO: Finish this function
        return ret
    if phrase == "tmp_mount" or phrase == "real_mount":
        rendered_path = __render_path(posixpath.join(
            server_data["fileShare"], relative_path), user_name, job_name)
        if server_data["proxy"]:
            return [
                "mount -t cifs //localhost/" + rendered_path + " {}"
                .format(mount_point) + " -o vers=3.0,username={},password={}"
                .format(server_data["accountName"], server_data["key"]) +
                ",dir_mode=0777,file_mode=0777,serverino"
            ]
        return [
            "mount -t cifs //{}"
            .format(server_data["dataStore"]) + rendered_path + " {}"
            .format(mount_point) + " -o vers=3.0,username={},password={}"
            .format(server_data["accountName"], server_data["key"]) +
            ",dir_mode=0777,file_mode=0777,serverino"
        ]
    if phrase == "post_mount":
        return []
    raise Exception("Unsupported phrase {}".format(phrase))


def __get_azureblob_setup_commands(server_config, mount_point, relative_path, phrase, user_name, job_name) -> list:
    # TODO fix me
    raise Exception("Unsupported phrase {}".format(phrase))


def __get_hdfs_setup_commands(server_config, mount_point, relative_path, phrase, user_name, job_name) -> list:
    # TODO need to finish
    raise Exception("Unsupported phrase {}".format(phrase))


def __render_path(ori_path, user_name, job_name) -> str:
    rendered_path = re.compile("%USER", re.IGNORECASE).sub(user_name, ori_path)
    rendered_path = re.compile("%JOB", re.IGNORECASE).sub(job_name, rendered_path)
    return posixpath.normpath(rendered_path)
