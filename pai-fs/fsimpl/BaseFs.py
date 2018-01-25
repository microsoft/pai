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

#!/usr/bin/env python

import time
import hashlib
import sys
import os
from fsimpl import Constants, Errors, Retryer
from fsimpl.Retryer import doubling_backoff, RetryAndCatch

def is_normal_stdout():
    return os.fstat(0) == os.fstat(1)


class FileDescriptor:
    @property
    def is_directory(self):
        return self.type == "DIRECTORY"

    @property
    def is_file(self):
        return self.type == "FILE"

    @property
    def is_symlink(self):
        return self.type == "SYMLINK"

    @property
    def file_descriptor(self):
        endString = ""
        assert len(self.permissions) == 3 or len(self.permissions) == 4
        if self.is_directory:
            endString += "d"
        elif self.is_symlink:
            endString += "s"
        else:
            endString += "-"

        hastPerm = False
        permissions = self.permissions
        if len(self.permissions) == 4:
            assert permissions[0] == '1'
            hastPerm = True
            permissions = permissions[1:]

        for i in range(0, 3):
            mask = int(permissions[i])
            endString += "r" if mask & 4 != 0 else "-"
            endString += "w" if mask & 2 != 0 else "-"
            endString += "x" if mask & 1 != 0 else "-"

        if hastPerm:
          endString = endString[:-1] + "t"

        return endString

class FileOpen:
    def __init__(self, fs, fd, isRead, rwMode="rb", offset=None, size=None):
        self.fileSystem = fs
        self.fileDescriptor = fd
        self.isRead = isRead
        self.rwMode = rwMode
        self.offset = offset if offset is not None else 0
        self.size = size if size is not None else fd.size
        self.file = None

    def __enter__(self):
        self.file = self.fileSystem.open_file(self.fileDescriptor, self.rwMode)
        if self.isRead:
            return self.fileSystem.read_chunk(self.file, self.offset, self.size)
        else:
            return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.fileSystem.close_file(self.file)


class FileSystem:
    def __init__(self, simulateOnly, isVerbose, logger):
        self.simulateOnly = simulateOnly
        self.bytesCopied = 0
        self.copyTime = 0.0
        self.verbose = isVerbose
        self.logger = logger

    def make_dst_dir(self, srcFd, dstFd, rootFd, createTopLevelDir):
        if createTopLevelDir:
            baseDir, _ = self.get_dir_basename(srcFd.abspath)
        else:
            baseDir = srcFd.abspath

        if(baseDir == "/"):
            skipLen = 0
        else:
            skipLen = self.get_dir_prefix_len(baseDir)
        dstDir = self.path_join(dstFd.abspath, rootFd.abspath[skipLen:])
        self.make_dir(dstDir)
        dstDirFd = self.make_fd(path=dstDir, isSrc=False, dstDirMustExist=True)
        return dstDirFd

    def path_join(self, base, suffix):
        base.replace("\\", "/")
        suffix.replace("\\", "/")
        assert not suffix.startswith("/")
        sep = "" if base.endswith("/") else "/"
        return base + sep + suffix

    def get_dir_basename(self, path):
        if path.endswith("/"):
            path = path[:-1]
        dstName = path.rpartition("/")[2]
        dstDir = path.rpartition("/")[0]

        if dstDir == "":
            dstDir = "/"

        return dstDir, dstName

    def canonicalize_path(self, path):
        return path.replace("\\", "/")

    def get_dir_prefix_len(self, path):
        return len(path) if path.endswith("/") else len(path) + 1

    def get_cp_rate(self):
        if self.bytesCopied != 0:
            return self.bytesCopied / self.copyTime

    def mv_file(self, src, dst, dstFs):
        if dst.is_directory:
            newPath = self.path_join(dst.abspath, src.name)
            newDst = self.make_fd(path=newPath, isSrc=False, dstDirMustExist=True)
            self.logger.info("MOVE TARGET: change from {0} to {1}".format(dst.abspath, newDst.abspath))
            dst = newDst

        if dst.exists and (src.is_directory == dst.is_directory) and (src.name == dst.name):
            print("Destination already exists, move will not be performed.")
            return

        if self.verbose:
            print("move: %s -> %s" % (src.abspath, dst.abspath))

        # TODO: There must be a better way to do this, but type(src) == type(dst) does not work
        if src.__class__.__name__ == dst.__class__.__name__:
            self.local_mv_file(src, dst)
        else:
            self.cp_file(src, dst, dstFs)
            self.delete_file_dir(src)

    @RetryAndCatch(Errors.FsException, 10, 10, doubling_backoff)
    def cp_chunk(self, src, dst, dstFs, srcOffset, dstOffset, lastChunk, dstWriteMode):
        size = Constants.DEFAULT_BIG_FILE_THRESHOLD - srcOffset % Constants.DEFAULT_BIG_FILE_THRESHOLD
        if lastChunk:
            size = src.size - srcOffset

        progressFormatString = "({0:>13,}/{1:>13,}) bytes"
        sizeWritten = 0
        
        with FileOpen(self, src, True, "rb", srcOffset, size) as srcCopy:
            with FileOpen(dstFs, dst, False, dstWriteMode, dstOffset, dstOffset) as dstCopy:
                for batch in srcCopy:
                    if self.verbose and is_normal_stdout():
                        sizeWritten += len(batch)
                        progressString = progressFormatString.format(sizeWritten, size)
                        sys.stdout.write(progressString)
                        sys.stdout.write("\b" * len(progressString))
                        sys.stdout.flush()
                    dstFs.append_data(dstCopy, batch)

    @RetryAndCatch(Errors.FsException, 5, 10)
    def make_fd_retriable(self, path, isSrc, dstDirMustExist):
        return self.make_fd(path, isSrc, dstDirMustExist)
    
    @RetryAndCatch(Errors.FsException, 5, 10, doubling_backoff)
    def concat_chunk_files(self, fs, fileName, chunkList):
        if chunkList:
            fs.touch_file(fileName)
            fs.try_concat_files(fileName, chunkList)

    def remote_cp_file(self, src, dst, dstFs):
        dstChunkList = None

        # Step 1: Perform a copy
        progressString = "- Progress: "
        self.logger.info("REMOTE COPY ({0}): {1} -> {2}".format(src.size, src.abspath, dst.abspath))
        if src.size <= Constants.DEFAULT_BIG_FILE_THRESHOLD:
            if self.verbose and is_normal_stdout():
                sys.stdout.write(progressString)
                sys.stdout.flush()
            if dst.exists:
                dstFs.delete_file_dir(dst)
            dstFs.touch_file(dst)

            self.cp_chunk(src, dst, dstFs, 0, 0, True, "wb")
        else:
            chunk = 0
            offset = 0
            chunkSize = Constants.DEFAULT_BIG_FILE_THRESHOLD
            numChunks = (src.size / chunkSize) + 1
            dstChunkList = list()
            while offset < src.size:
                dstChunk = dstFs.make_fd_retriable(
                        dst.abspath + ".__chunk__" + str(chunk),
                        isSrc=False,
                        dstDirMustExist=True)
                
                dstChunkList.append(dstChunk)
                self.logger.info("BIG COPY: chunk={0}, dst={1}".format(chunk, dstChunk.abspath))

                if dstChunk.exists:
                    dstFs.delete_file_dir(dstChunk)
                dstFs.touch_file(dstChunk)
                
                if dstChunk.size == Constants.DEFAULT_BIG_FILE_THRESHOLD \
                        and src.modificationTime <= dstChunk.modificationTime:
                    if self.verbose:
                        print("%s -> %s: skipped" % (src.abspath, dstChunk.abspath))
                elif dstChunk.size > Constants.DEFAULT_BIG_FILE_THRESHOLD:
                    errMsg = "a chunk: {0} has its size bigger than max size, you need remove it before next retry".format(dstChunk.abspath)
                    self.logger.error(errMsg)
                    raise Errors.FsException(errMsg)
                else:
                    if self.verbose:
                        print("%s -> %s" % (src.abspath, dstChunk.abspath))
                        if is_normal_stdout():
                            progressFormatString = "Chunk ({0}/{1}) - "
                            progressString += progressFormatString.format(chunk + 1, numChunks)
                            sys.stdout.write(progressString)
                            sys.stdout.flush()
                    self.cp_chunk(src, dstChunk, dstFs, offset+dstChunk.size, dstChunk.size, chunk == numChunks -1, "ab")
                    if self.verbose and is_normal_stdout():
                        sys.stdout.write("\r")
                        sys.stdout.flush()
                chunk += 1
                offset = chunk * chunkSize
        
        # Step2: concat all chunk files into final file
        self.concat_chunk_files(dstFs, dst, dstChunkList)

    def cp_file(self, src, dst, dstFs, force):
        self.logger.info("COPY: from({0})={1} to({2})={3}".format(src.fs.__class__.__name__,
                                                                  src.abspath,
                                                                  dst.fs.__class__.__name__,
                                                                  dst.abspath))
        if dst.is_directory:
            newPath = self.path_join(dst.abspath, src.name)
            newDst = dstFs.make_fd(path=newPath, isSrc=False, dstDirMustExist=True)
            self.logger.info("COPY TARGET: change from {0} to {1}".format(dst.abspath, newDst.abspath))
            dst = newDst

        if dst.exists and not force:
            if self.verbose:
                print("Destination already exists, move will not be performed. Add -f to force copy" % (dst.abspath))
            return
        else:
            if self.verbose:
                print("%s -> %s" % (src.abspath, dst.abspath))

        startTime = time.time()

        # TODO: There must be a better way to do this, but type(src) == type(dst) does not work
        if src.__class__.__name__ == dst.__class__.__name__:
            # This is purely a performance optimization, the code below will
            # perform a deep copy which is just as good
            self.logger.info("LOCAL COPY: {0} -> {1}".format(src.abspath, dst.abspath))
            self.local_cp_file(src, dst)
        else:
            self.remote_cp_file(src, dst, dstFs)

        endTime = time.time()

        dst = dstFs.make_fd_retriable(dst.abspath, False, True)
        if src.size != dst.size:
            raise ValueError("Size mismatch, %s size %d, %s size %d" % (src.abspath, src.size, dst.abspath, dst.size))

        self.bytesCopied += src.size
        self.copyTime += endTime - startTime

    def compute_hash(self, fd):
        chunk = 0
        offset = 0
        hashList = list()
        while offset < fd.size:
            hasher = hashlib.sha1()
            size = min(Constants.DEFAULT_BIG_FILE_THRESHOLD, fd.size - offset)
            with FileOpen(self, fd, True, "rb", offset, size) as srcCopy:
                for batch in srcCopy:
                    hasher.update(batch)

            currHash = str(hasher.hexdigest())
            self.logger.debug("HASH for {0}, {1}-{2}: {3}".format(fd.abspath, offset, offset + size, currHash))
            hashList.append(currHash)
            chunk += 1
            offset = chunk*Constants.DEFAULT_BIG_FILE_THRESHOLD

        hasher = hashlib.sha1()

        for subHash in hashList:
            hasher.update(subHash.encode("utf-8"))

        print("Hash for file {0} is {1}".format(fd.abspath, str(hasher.hexdigest())))

    def walk(self, fd):
        # Not able to use os.walk in local case as it is too slow for large directories
        workList = list()
        workList.append(fd)
        while len(workList) > 0:
            currDir = workList.pop(0)
            fileList = list()
            dirList = list()
            try:
                for item in self.list_dir(currDir):
                    if item.is_directory:
                        workList.append(item)
                        dirList.append(item)
                    elif item.is_file or item.is_symlink:
                        fileList.append(item)
            except Errors.Unauthorized:
                print("Insufficient privileges to access the path: %s" % currDir.abspath)

            yield currDir, dirList, fileList

    def fast_walk(self, fd):
        # Not able to use os.walk in local case as it is too slow for large directories
        workList = list()
        workList.append(fd)
        currDir = None
        while len(workList) > 0:
            prevDir = currDir
            currDir = workList.pop(0)
            try:
                for item in self.list_dir(currDir):
                    if item.is_directory:
                        workList.append(item)
                    elif item.is_file or item.is_symlink:
                        yield prevDir != currDir, currDir, item
            except Errors.Unauthorized:
                print("Insufficient privileges to access the path: %s" % currDir.abspath)

    def read_chunk(self, srcFile, offset, size, chunkSize=Constants.DEFAULT_COPY_CHUNK_SIZE):
        sizeLeftToRead = size
        while sizeLeftToRead != 0:
            startTime = time.time()
            data = self.read_data(srcFile, offset, chunkSize)
            elapsedTime = time.time() - startTime
            sizeRead = len(data)
            self.logger.debug("Read: {0:,} bytes in {1} secs, copy rate {2:,} bytes/sec".format(
                sizeRead, elapsedTime, sizeRead/elapsedTime))
            sizeLeftToRead -= sizeRead
            assert sizeLeftToRead >= 0
            offset += sizeRead
            yield data

    def make_fd(self, path, isSrc, dstDirMustExist):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def exists_file_dir(self, fd):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def delete_file_dir(self, fd, recursive, force):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def list_dir(self, fd):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def make_dir(self, path):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def open_file(self, fd, rwMode):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def close_file(self, fd):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def touch_file(self, fd):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def truncate_file(self, fd, size):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def try_concat_files(self, fd, chunkFdList):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def concat_files(self, fd, chunkFdList):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def read_data(self, fd, offset, size):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def append_data(self, fd, data):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def local_mv_file(self, src, dst):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")

    def local_cp_file(self, src, dst):
        raise NotImplementedError("This function must be implemented by the FS class that extends base FS")
