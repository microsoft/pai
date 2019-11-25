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

import posixpath
import re


class StorageHelper():
    def __init__(self, user_name, job_name):
        self.user_name = user_name
        self.job_name = job_name

    @staticmethod
    def is_valid_storage_config(user_storage_config, storage_config_names) -> bool:
        for storage_config in storage_config_names:
            if storage_config not in user_storage_config:
                return False
        return True

    @staticmethod
    def perpare_server_mount_dict(storage_configs) -> dict:
        server_mount_dict = {}
        for config in storage_configs:
            for mount_info in config["mountInfos"]:
                if mount_info["server"] in server_mount_dict:
                    server_mount_dict[mount_info["server"]].append(mount_info)
                else:
                    server_mount_dict[mount_info["server"]] = [mount_info]
        return server_mount_dict

    @staticmethod
    def validate_mount_point(mount_points, mount_infos) -> None:
        for mount_info in mount_infos:
            # Check duplicated mount points
            if mount_info["mountPoint"] in mount_points:
                raise Exception(
                    "Mount point error! More than one mount point [" +
                    mount_info["mountPoint"] + "]!")
            mount_points.append(mount_info["mountPoint"])

    def get_setup_command(self, server_config, mount_point, phrase, relative_path="", pre_mounted_dir="") -> list:
        """
        function used to generate storage setup commands. Currently, we support nfs, samba, auzrefile and azureblob
        as the PAI storage
        """
        server_type = server_config["type"]
        if server_type == "nfs":
            return self.__get_nfs_setup_commands(server_config, mount_point, relative_path, phrase)
        if server_type == "samba":
            return self.__get_samba_setup_commands(server_config, mount_point, relative_path, phrase)
        if server_type == "azurefile":
            return self.__get_azurefile_setup_commands(server_config, mount_point, relative_path, phrase)
        if server_type == "azureblob":
            return self.__get_azureblob_setup_commands(server_config, mount_point, relative_path, pre_mounted_dir,
                                                       phrase)
        raise Exception("Not supproted server type {}".format(server_type))

    def generate_make_tmp_folder_command(self, tmp_folder, mount_infos) -> list:
        mkdir_commands = list(map(lambda mount_info: [
            "mkdir --parents {}".format(
                posixpath.normpath(mount_info["mountPoint"])),
            "mkdir --parents {}".format(self.__render_path(posixpath.join(tmp_folder, mount_info["path"]),))],
                                  mount_infos))
        mkdir_commands = [
            command for mkdir_command in mkdir_commands for command in mkdir_command]
        return mkdir_commands

    def __get_nfs_setup_commands(self, server_config, mount_point, relative_path, phrase) -> list:
        if phrase == "pre_mount":
            return [
                "mkdir --parents {}".format(mount_point),
                "apt-get install --assume-yes nfs-common",
            ]
        if phrase in ("tmp_mount", "real_mount"):
            server_data = server_config["data"]
            rendered_path = self.__render_path(posixpath.join(server_data["rootPath"], relative_path))
            return [
                "mount -t nfs4 {}:{} {}"
                .format(posixpath.normpath(server_data["address"]), rendered_path, mount_point)
            ]
        if phrase == "post_mount":
            return ["umount -l {}".format(mount_point), "rm -r {}".format(mount_point)]
        raise Exception("Unsupported phrase {}".format(phrase))

    def __get_samba_setup_commands(self, server_config, mount_point, relative_path, phrase) -> list:
        if phrase == "pre_mount":
            return [
                "mkdir --parents {}".format(mount_point),
                "apt-get install --assume-yes cifs-utils",
            ]
        if phrase in ("tmp_mount", "real_mount"):
            server_data = server_config["data"]
            rendered_path = self.__render_path(posixpath.join(server_data["rootPath"], relative_path))
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

    def __get_azurefile_setup_commands(self, server_config, mount_point, relative_path, phrase) -> list:
        server_data = server_config["data"]
        if phrase == "pre_mount":
            ret = [
                "mkdir --parents {}".format(mount_point),
                "apt-get install --assume-yes cifs-utils",
            ]
            if "proxy" in server_data and len(server_data["proxy"]) == 2:
                ret.append("apt-get install --assume-yes sshpass")
                proxy_info: str = server_data["proxy"][0]
                proxy_password: str = server_data["proxy"][1]
                proxy_ip = proxy_info if proxy_info.find("@") == -1 else proxy_info[proxy_info.find("@"):]
                ret = ret + [
                    "mkdir --parents ~/.ssh",
                    "ssh-keyscan {} >> ~/.ssh/known_hosts".format(proxy_ip),
                    "sshpass -p '{}' ssh -N -f -L 445:{}:445 {}".format(
                        proxy_password, server_data["dataStore"], proxy_info)
                ]
            return ret
        if phrase in ("tmp_mount", "real_mount"):
            rendered_path = self.__render_path(posixpath.join(
                server_data["fileShare"], relative_path))
            if "proxy" in server_data:
                return [
                    "mount -t cifs //localhost/" + rendered_path + " {}"
                    .format(mount_point) + " -o vers=3.0,username={},password={}"
                    .format(server_data["accountName"], server_data["key"]) +
                    ",dir_mode=0777,file_mode=0777,serverino"
                ]
            return [
                "mount -t cifs //{}/{}"
                .format(server_data["dataStore"], rendered_path) + " {}"
                .format(mount_point) + " -o vers=3.0,username={},password={}"
                .format(server_data["accountName"], server_data["key"]) +
                ",dir_mode=0777,file_mode=0777,serverino"
            ]
        if phrase == "post_mount":
            return ["umount -l {}".format(mount_point), "rm -r {}".format(mount_point)]
        raise Exception("Unsupported phrase {}".format(phrase))

    def __get_azureblob_setup_commands(self, server_config, mount_point, relative_path,
                                       pre_mounted_dir, phrase) -> list:
        server_data = server_config["data"]
        server_name = server_config["spn"]
        tmp_path = "/mnt/resource/blobfusetmp/{}".format(server_name)
        cfg_file = "/{}.cfg".format(server_name)
        if phrase == "pre_mount":
            return [
                "apt-get install --assume-yes wget curl lsb-release apt-transport-https",
                "valid_release=('14.04' '15.10' '16.04' '16.10' '17.04' '17.10' '18.04' '18.10' '19.04')",
                "release=`lsb_release -r | cut -f 2`",
                "if [[ ! ${valid_release[@]} =~ ${release} ]];" +
                " then echo \"Invalid OS version for Azureblob!\"; exit 1; fi",
                "wget https://packages.microsoft.com/config/ubuntu/${release}/packages-microsoft-prod.deb",
                "dpkg -i packages-microsoft-prod.deb",
                "apt-get update",
                "apt-get install --assume-yes blobfuse fuse", # blob to mount and fuse to unmount
                "mkdir --parents {}".format(tmp_path),
                # Generate mount point
                "echo \"accountName {}\" >> {}".format(server_data["accountName"], cfg_file),
                "echo \"accountKey {}\" >> {}".format(server_data["key"], cfg_file),
                "echo \"containerName {}\" >> {}".format(server_data["containerName"], cfg_file),
                "chmod 600 {}".format(cfg_file),
                "mkdir --parents {}".format(mount_point),
            ]
        if phrase == "tmp_mount":
            return [
                "blobfuse {} --tmp-path={} --config-file={} -o attr_timeout=240 "
                .format(mount_point, tmp_path, cfg_file) + "-o entry_timeout=240 -o negative_timeout=120"
            ]
        if phrase == "real_mount":
            rendered_path = self.__render_path(posixpath.join(pre_mounted_dir, relative_path))
            return [
                "rm -r {}".format(mount_point),
                "ln -s {} {}".format(rendered_path, mount_point)
            ]
        if phrase == "post_mount":
            return []
        raise Exception("Unsupported phrase {}".format(phrase))

    def __render_path(self, ori_path) -> str:
        rendered_path = re.compile("%USER", re.IGNORECASE).sub(self.user_name, ori_path)
        rendered_path = re.compile("%JOB", re.IGNORECASE).sub(self.job_name, rendered_path)
        return posixpath.normpath(rendered_path)
