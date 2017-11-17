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
import errno
import shutil
import datetime

if os.name != "nt":
    import pwd
    import grp

from fsimpl import BaseFs, Constants, Errors

class LocalFileDescriptor(BaseFs.FileDescriptor):
    def __init__(self, localFs, path, isSrc, dstDirMustExist):
        self.fs = localFs
        # Canonicalize path to "/" on descriptor creation
        path = localFs.canonicalize_path(path)

        # Local file system
        if not os.path.exists(path):
            if isSrc:
                raise Errors.FileNotFound("path: %s not found" % path)
            else:
                dstDir, dstName = localFs.get_dir_basename(path)
                if dstDirMustExist and not os.path.exists(dstDir):
                    raise Errors.FileNotFound("destination directory: %s not found" % dstDir)

                self.name = dstName
                self.abspath = path
                self.type = "FILE"

                self.accessTime = datetime.datetime.fromtimestamp(86400)
                self.modificationTime = datetime.datetime.fromtimestamp(86400)
                self.exists = False
                self.replication = "1"
                self.permissions = "777"
                self.owner = "root"
                self.group = "supergroup"
                self.numChildren = "0"
                self.size = 0
                return

        if os.path.islink(path):
            self.type = "SYMLINK"
        elif os.path.isfile(path):
            self.type = "FILE"
        elif os.path.isdir(path):
            self.type = "DIRECTORY"

        self.exists = True
        self.abspath = localFs.canonicalize_path(os.path.abspath(path))
        _, self.name = localFs.get_dir_basename(self.abspath)

        self.replication = "1"
        self.numChildren = "1"

        if os.name == "nt":
            self.size = os.path.getsize(path)
            self.modificationTime = datetime.datetime.fromtimestamp(os.path.getmtime(path))
            self.accessTime = datetime.datetime.fromtimestamp(os.path.getatime(path))
            self.permissions = "777"
            self.owner = "-"
            self.group = "-"
        else:
            statinfo = os.stat(self.abspath)
            self.size = statinfo.st_size
            self.modificationTime = datetime.datetime.fromtimestamp(statinfo.st_mtime)
            self.accessTime = datetime.datetime.fromtimestamp(statinfo.st_atime)
            self.permissions = str(oct(statinfo.st_mode))[-3:]
            self.owner = pwd.getpwuid(statinfo.st_uid).pw_name
            self.group = grp.getgrgid(statinfo.st_gid).gr_name

class LocalFileSystem(BaseFs.FileSystem):
    def __init__(self, simulateOnly = False, isVerbose=False, logger=None):
        BaseFs.FileSystem.__init__(self, simulateOnly, isVerbose, logger)

    def make_fd(self, path, isSrc, dstDirMustExist):
        return LocalFileDescriptor(self, path, isSrc, dstDirMustExist)

    def exists_file_dir(self, fd):
        return os.path.isdir(fd.abspath) or os.path.isdir(fd.abspath)

    def delete_file_dir(self, fd, recursive=False, force=False):
        if fd.is_file or fd.is_symlink:
            if self.simulateOnly:
                print("SIMULATE -> remove file: " + fd.abspath)
            else:
                os.remove(fd.abspath)
        elif fd.is_directory:
            if recursive:
                if self.simulateOnly:
                    print("SIMULATE -> remove directory recursively: " + fd.abspath)
                else:
                    shutil.rmtree(fd.abspath)
            else:
                if self.simulateOnly:
                    print("SIMULATE -> remove directory: " + fd.abspath)
                else:
                    #os.rmdir(fd.abspath)
                    print("cannot remove: Is a directory")

    def list_dir(self, fd):
        try:
            dirList = os.listdir(fd.abspath)
        except:
            print("Not enough permissions to enter: " + fd.abspath)
            dirList = list()

        for item in dirList:
            yield LocalFileDescriptor(self, self.path_join(fd.abspath, item), isSrc=True, dstDirMustExist=False)

    def make_dir(self, path):
        try:
            if self.simulateOnly:
                print("SIMULATE -> making dir: " + path)
            else:
                os.makedirs(path)
        except OSError as exc:
            if exc.errno == errno.EEXIST and os.path.isdir(path):
                pass
            else:
                raise

    def open_file(self, fd, rwMode="rb"):
        if self.simulateOnly:
            print("SIMULATE -> write file: " + fd.abspath)
        else:
            return open(fd.abspath, rwMode)

    def close_file(self, fd):
        fd.flush()
        fd.close()

    def touch_file(self, fd):
        with open(fd.abspath, 'a'):
            os.utime(fd.abspath, None)

    def truncate_file(self, fd, size):
        if self.simulateOnly:
            print("SIMULATE -> truncate file({0}): {1}".format(size, fd.abspath))
        else:
            fd.truncate(size)

    def try_concat_files(self, fd, chunkFdList):
        self.concat_files(fd, chunkFdList)
        return len(chunkFdList)

    def concat_files(self, fd, chunkFdList):
        with open(fd.abspath, 'wb') as dst:
            for chunkFd in chunkFdList:
                with open(chunkFd.abspath, 'rb') as chunkFile:
                    shutil.copyfileobj(chunkFile, dst, Constants.DEFAULT_COPY_CHUNK_SIZE)

        for chunkFd in chunkFdList:
            self.delete_file_dir(chunkFd, False)

    def read_data(self, fd, offset, size):
        currentPos = fd.tell()
        if currentPos != offset:
            self.logger.info(
                "Current position {0} in the file does not match the offset {1} provided, seek will be used".format(
                    currentPos, offset))
            fd.seek(offset)
        return fd.read(size)

    def append_data(self, fd, data):
        if self.simulateOnly:
            print("SIMULATE -> write data: " + fd.abspath)
        else:
            fd.write(data)

    def local_mv_file(self, src, dst):
        if self.simulateOnly:
            print("SIMULATE -> local move file: {0} -> {1} ".format(src.abspath, dst.abspath))
        else:
            shutil.move(src.abspath, dst.abspath)

    def local_cp_file(self, src, dst):
        if self.simulateOnly:
            print("SIMULATE -> local copy file: {0} -> {1} ".format(src.abspath, dst.abspath))
        else:
            shutil.copyfile(src.abspath, dst.abspath)
