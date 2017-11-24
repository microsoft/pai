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

import os
import sys

localPath = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(localPath, "../pywebhdfs"))

from pywebhdfs.webhdfs import PyWebHdfsClient
import pywebhdfs.errors
import requests
import datetime
import fsimpl
from fsimpl import BaseFs, Errors, Config

try:
    import __builtin__
    input = getattr(__builtin__, 'raw_input')
except (ImportError, AttributeError):
    pass

def query_yes_no(question, default="yes"):
    """Ask a yes/no question via raw_input() and return their answer.

    "question" is a string that is presented to the user.
    "default" is the presumed answer if the user just hits <Enter>.
        It must be "yes" (the default), "no" or None (meaning
        an answer is required of the user).

    The "answer" return value is True for "yes" or False for "no".
    """
    valid = {"yes": True, "y": True, "ye": True,
             "no": False, "n": False}
    if default is None:
        prompt = " [y/n] "
    elif default == "yes":
        prompt = " [Y/n] "
    elif default == "no":
        prompt = " [y/N] "
    else:
        raise ValueError("invalid default answer: '%s'" % default)

    while True:
        sys.stdout.write(question + prompt)
        choice = input().lower()
        if default is not None and choice == '':
            return valid[default]
        elif choice in valid:
            return valid[choice]
        else:
            sys.stdout.write("Please respond with 'yes' or 'no' (or 'y' or 'n').\n")


class HadoopFileDescriptor(BaseFs.FileDescriptor):
    def __init__(self, hadoopFs, path, isSrc, needsDstDirCheck, fileJson=None):
        self.fs = hadoopFs

        if fileJson is None:
            # If JSON is not passed in, we have to read the entry from HDFS
            fileJson = hadoopFs.get_hdfs_file_dir_json(path)
            if fileJson is None:
                # File/directory does not exist
                if isSrc:
                    raise pywebhdfs.errors.FileNotFound("path: %s not found" % path)
                else:
                    dstDir, dstName = hadoopFs.get_dir_basename(path)

                    # Pure optimization. In some cases we already know that destination folder is there
                    # since we traversed over it. So in that case elide the HDFS query
                    if needsDstDirCheck:
                        fileJson = hadoopFs.get_hdfs_file_dir_json(dstDir)
                        if fileJson is None:
                            raise pywebhdfs.errors.FileNotFound("destination directory: %s not found" % dstDir)

                    self.name = dstName
                    self.abspath = path
                    self.type = "FILE"
                    # due to a bug of python3.6, it will show an error if timestamp is set to 0.
                    self.accessTime = datetime.datetime.fromtimestamp(86400)
                    self.modificationTime = datetime.datetime.fromtimestamp(86400)
                    self.replication = "3"
                    self.exists = False
                    self.size = 0
                    return
        else:
            # JSON is passed in as a part of a previous query on a containing directory
            if fileJson["pathSuffix"] != "":
                path = hadoopFs.path_join(path, fileJson["pathSuffix"])

        self.exists = True
        self.abspath = path
        self.type = fileJson["type"]
        if fileJson["pathSuffix"] == "":
            _, self.name = hadoopFs.get_dir_basename(self.abspath)
        else:
            self.name = fileJson["pathSuffix"]
        self.replication = fileJson["replication"]
        self.permissions = fileJson["permission"]
        if self.permissions == "0":
            self.permissions = "000"
        self.owner = fileJson["owner"]
        self.group = fileJson["group"]
        self.size = fileJson["length"]
        self.numChildren = fileJson["childrenNum"]
        if self.is_file or self.is_symlink and self.numChildren == 0:
            self.numChildren = 1
        if(float(fileJson["modificationTime"])/1000<86400):
            self.modificationTime = datetime.datetime.fromtimestamp(86400)
        else:
            self.modificationTime = datetime.datetime.fromtimestamp(float(fileJson["modificationTime"])/1000)
        if(float(fileJson["accessTime"])/1000<86400):
            self.accessTime = datetime.datetime.fromtimestamp(86400)
        else:
            self.accessTime = datetime.datetime.fromtimestamp(float(fileJson["accessTime"])/1000)


class HadoopFileSystem(BaseFs.FileSystem):
    def __init__(self, vcPath, simulateOnly = False, isVerbose=False, logger=None, user=None, host=None, port=None):
        BaseFs.FileSystem.__init__(self, simulateOnly, isVerbose, logger)
        config = Config.Config()
        hdfsUser, hdfsHost, hdfsPort = config.getHadoopConfig(user, host, port)
        self.hdfs = PyWebHdfsClient(host=hdfsHost, port=hdfsPort, user_name=hdfsUser)
        self.vcPath = vcPath

    def make_fd(self, path, isSrc, dstDirMustExist):
        fd = None
        try:
            fd = HadoopFileDescriptor(self, path, isSrc, dstDirMustExist)
        except pywebhdfs.errors.FileNotFound:
            self.logger.info("DESC: does not exist: " + path)
            raise Errors.FileNotFound("Path {0} does not exist".format(path))
        except pywebhdfs.errors.Unauthorized as e:
            self.logger.info("Unauthorized for path {0}: {1}".format(path, e))
            raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(path, e))
        except requests.exceptions.RequestException as e:
            self.logger.info("ConnectionError for path {0}: {1}".format(path, e))
            raise Errors.BadConnection("Connection error while looking for path: {0}, exc={1}".format(path, e))
        except pywebhdfs.errors.PyWebHdfsException as e:
            self.logger.info("PyWebHdfsException for path {0}: {1}".format(path, e))
            raise Errors.FsException("An exception happened while looking for path: {0}, exc={1}".format(path, e))
        return fd

    def exists_file_dir(self, fd):
        try:
            return self.hdfs.exists_file_dir(fd.abspath)
        except pywebhdfs.errors.Unauthorized as e:
            self.logger.info("Unauthorized for path {0}: {1}".format(fd.abspath, e))
            raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(fd.abspath, e))
        except requests.exceptions.RequestException as e:
            self.logger.info("ConnectionError for path {0}: {1}".format(fd.abspath, e))
            raise Errors.BadConnection("Connection error during HDFS exists test: {0}, exc={1}".format(fd.abspath, e))
        except pywebhdfs.errors.PyWebHdfsException as e:
            self.logger.info("PyWebHdfsException for path {0}: {1}".format(fd.abspath, e))
            raise Errors.FsException("An exception happened during HDFS exists test: {0}, exc={1}".format(fd.abspath, e))

    def delete_file_dir(self, fd, recursive=False, force=False):
        if self.simulateOnly:
            print("SIMULATE -> remove file/dir: {0}, recursive={1}".format(fd.abspath, recursive))
        else:
            try:
                if not recursive or force or \
                        query_yes_no(question="Are you sure you want to delete folder recursively?", default="no"):
                    status = self.hdfs.delete_file_dir(fd.abspath, recursive=recursive)
            except pywebhdfs.errors.Unauthorized as e:
                self.logger.info("Unauthorized for path {0}: {1}".format(fd.abspath, e))
                raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(fd.abspath, e))
            except requests.exceptions.RequestException as e:
                self.logger.info("ConnectionError for path {0}: {1}".format(fd.abspath, e))
                raise Errors.BadConnection("Connection error during HDFS delete directory: {0}, exc={1}".format(fd.abspath, e))
            except pywebhdfs.errors.PyWebHdfsException as e:
                self.logger.info("PyWebHdfsException for path {0}: {1}".format(fd.abspath, e))
                raise Errors.FsException("An exception happened during HDFS delete directory: {0}, exc={1}".format(fd.abspath, e))

    def list_dir(self, fd):
        try:
            status = self.hdfs.list_dir(fd.abspath)
        except pywebhdfs.errors.Unauthorized as e:
            self.logger.info("Unauthorized for path {0}: {1}".format(fd.abspath, e))
            raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(fd.abspath, e))
        except requests.exceptions.RequestException as e:
            self.logger.info("ConnectionError for path {0}: {1}".format(fd.abspath, e))
            raise Errors.BadConnection("Connection error while looking for path: {0}, exc={1}".format(fd.abspath, e))
        except pywebhdfs.errors.PyWebHdfsException as e:
            self.logger.info("PyWebHdfsException for path {0}: {1}".format(fd.abspath, e))
            raise Errors.FsException("An exception happened while looking for path: {0}, exc={1}".format(fd.abspath, e))
        currentDir = status["FileStatuses"]["FileStatus"]
        for item in currentDir:
            yield HadoopFileDescriptor(self, fd.abspath, isSrc=True, needsDstDirCheck=False, fileJson=item)

    def make_dir(self, path):
        if self.simulateOnly:
            print("SIMULATE -> make dir: " + path)
        else:
            try:
                self.hdfs.make_dir(path)
            except pywebhdfs.errors.Unauthorized as e:
                self.logger.info("Unauthorized for path {0}: {1}".format(path, e))
                raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(path, e))
            except requests.exceptions.RequestException as e:
                self.logger.info("ConnectionError for path {0}: {1}".format(path, e))
                raise Errors.BadConnection("Connection error during HDFS create directory: {0}, exc={1}".format(path, e))
            except pywebhdfs.errors.PyWebHdfsException as e:
                self.logger.info("PyWebHdfsException for path {0}: {1}".format(path, e))
                raise Errors.FsException("An exception happened during HDFS create directory: {0}, exc={1}".format(path, e))

    def open_file(self, fd, rwMode):
        return fd

    def close_file(self, fd):
        pass

    def touch_file(self, fd):
        if self.simulateOnly:
            print("SIMULATE -> touch file: " + fd.abspath)
        else:
            try:
                self.hdfs.create_file(fd.abspath, 0, overwrite=True)
            except pywebhdfs.errors.Unauthorized as e:
                self.logger.info("Unauthorized for path {0}: {1}".format(fd.abspath, e))
                raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(fd.abspath, e))
            except requests.exceptions.RequestException as e:
                self.logger.info("ConnectionError for path {0}: {1}".format(fd.abspath, e))
                raise Errors.BadConnection("Connection error during HDFS create file: {0}, exc={1}".format(fd.abspath, e))
            except pywebhdfs.errors.PyWebHdfsException as e:
                self.logger.info("PyWebHdfsException for path {0}: {1}".format(fd.abspath, e))
                raise Errors.FsException("An exception happened during HDFS create file: {0}, exc={1}".format(fd.abspath, e))

    def truncate_file(self, fd, size):
        if self.simulateOnly:
            print("SIMULATE -> truncate file: {0}, size={1}".format(fd.abspath, size))
        else:
            try:
                self.hdfs.truncate_file(fd.abspath, size)
            except pywebhdfs.errors.Unauthorized as e:
                self.logger.info("Unauthorized for path {0}: {1}".format(fd.abspath, e))
                raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(fd.abspath, e))
            except requests.exceptions.RequestException as e:
                self.logger.info("ConnectionError for path {0}: {1}".format(fd.abspath, e))
                raise Errors.BadConnection("Connection error during HDFS truncate file: {0}, exc={1}".format(fd.abspath, e))
            except pywebhdfs.errors.PyWebHdfsException as e:
                self.logger.info("PyWebHdfsException for path {0}: {1}".format(fd.abspath, e))
                raise Errors.FsException("An exception happened during HDFS truncate file: {0}, exc={1}".format(fd.abspath, e))

    def try_concat_files(self, fd, chunkFdList):
        # Workaround for unordered concat bug in Hadoop 2.7.1 is to use one source at the time
        # https://issues.apache.org/jira/browse/HDFS-8891
        currIndex = 0
        concatStep = 20
        chunkedList = [chunkFdList[pos:pos + concatStep] for pos in range(0, len(chunkFdList), concatStep)]
        for sourceChunk in chunkedList:
            try:
                self.concat_files(fd, sourceChunk)
                currIndex += len(sourceChunk)
            except Errors.FsException as e:
                break

        return currIndex

    def concat_files(self, fd, chunkFdList):
        strList = list()
        for chunkFd in chunkFdList:
            strList.append(chunkFd.abspath)

        if self.simulateOnly:
            print("SIMULATE -> concat file: {0}, sources={1}".format(fd.abspath, ",".join(strList)))
        else:
            try:
                self.hdfs.concat_files(fd.abspath, strList)
            except pywebhdfs.errors.Unauthorized as e:
                self.logger.info("Unauthorized for path {0}: {1}".format(fd.abspath, e))
                raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(fd.abspath, e))
            except requests.exceptions.RequestException as e:
                self.logger.info("ConnectionError for path {0}: {1}".format(fd.abspath, e))
                raise Errors.BadConnection("Connection error during HDFS concat file: {0}, exc={1}".format(fd.abspath, e))
            except pywebhdfs.errors.PyWebHdfsException as e:
                self.logger.info("PyWebHdfsException for path {0}: {1}".format(fd.abspath, e))
                raise Errors.FsException("An exception happened during HDFS concat file: {0}, exc={1}".format(fd.abspath, e))

    def read_data(self, fd, offset, size):
        if offset >= fd.size:
            return ""
        else:
            try:
                contents = self.hdfs.read_file(fd.abspath, offset=offset, length=size)
            except pywebhdfs.errors.Unauthorized as e:
                self.logger.info("Unauthorized for path {0}: {1}".format(fd.abspath, e))
                raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(fd.abspath, e))
            except requests.exceptions.RequestException as e:
                self.logger.info("ConnectionError for path {0}: {1}".format(fd.abspath, e))
                raise Errors.BadConnection("Connection error during HDFS read file: {0}, exc={1}".format(fd.abspath, e))
            except pywebhdfs.errors.PyWebHdfsException as e:
                self.logger.info("PyWebHdfsException for path {0}: {1}".format(fd.abspath, e))
                raise Errors.FsException("An exception happened during HDFS read file: {0}, exc={1}".format(fd.abspath, e))
            return contents

    def append_data(self, fd, data):
        if self.simulateOnly:
            print("SIMULATE -> write file data: " + fd.abspath)
        else:
            try:
                self.hdfs.append_file(fd.abspath, data)
            except pywebhdfs.errors.Unauthorized as e:
                self.logger.info("Unauthorized for path {0}: {1}".format(fd.abspath, e))
                raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(fd.abspath, e))
            except requests.exceptions.RequestException as e:
                self.logger.info("ConnectionError for path {0}: {1}".format(fd.abspath, e))
                raise Errors.BadConnection("Connection error during HDFS append file: {0}, exc={1}".format(fd.abspath, e))
            except pywebhdfs.errors.PyWebHdfsException as e:
                self.logger.info("PyWebHdfsException for path {0}: {1}".format(fd.abspath, e))
                raise Errors.FsException("An exception happened during HDFS append file: {0}, exc={1}".format(fd.abspath, e))

    def local_mv_file(self, src, dst):
        if self.simulateOnly:
            print("SIMULATE -> local move file: {0} -> {1} ".format(src.abspath, dst.abspath))
        else:
            try:
                self.hdfs.rename_file_dir(src.abspath, dst.abspath)
            except pywebhdfs.errors.Unauthorized as e:
                self.logger.info("Unauthorized for path {0}: {1}".format(src.abspath, e))
                raise Errors.Unauthorized("Unauthorized access to the path {0}: {1}".format(src.abspath, e))
            except requests.exceptions.RequestException as e:
                self.logger.info("ConnectionError for path {0}: {1}".format(src.abspath, e))
                raise Errors.BadConnection("Connection error during HDFS rename file: {0}, exc={1}".format(src.abspath, e))
            except pywebhdfs.errors.PyWebHdfsException as e:
                self.logger.info("PyWebHdfsException for path {0}: {1}".format(src.abspath, e))
                raise Errors.FsException("An exception happened during HDFS rename file: {0}, exc={1}".format(src.abspath, e))

    def local_cp_file(self, src, dst):
        # This is an open issue in Hadoop community: https://issues.apache.org/jira/browse/HDFS-3370
        # Instead, we can do a symbolic link
        if self.simulateOnly:
            print("SIMULATE -> local copy file: {0} -> {1} ".format(src.abspath, dst.abspath))
        else:
            print("Copy within HDFS is not supported due to lack of Hadoop support")
            print("Once symbolic links are enabled, this feature will be enabled")
            sys.exit(1)
            # self.hdfs.create_sym_link(src.abspath, dst.abspath, createParent=True)

    def get_hdfs_file_dir_json(self, path):
        try:
            status = self.hdfs.get_file_dir_status(path)
            return status["FileStatus"]
        except pywebhdfs.errors.FileNotFound:
            return None

    def validate_hdfs_arg(self, arg):
        if not arg.startswith(self.vcPath):
            print("Error: You don't have permissions to the path: %s" % arg)
            print("Your path must be rooted under: %s" % self.vcPath)
            sys.exit(1)
