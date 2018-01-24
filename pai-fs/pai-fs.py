#!/usr/bin/env python

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

import logging
import argparse
import time
import re
import getpass
from fsimpl import HadoopFs, LocalFs, Errors, Config

hdfsVirtualCluster = "/"
simulateOnly = False
logger = None
isVerbose = False

hdfsPattern = re.compile("hdfs://+")
fileSystemWithMetrics = None
hdfsUser = None
hdfsHost = None
hdfsPort = None

def process_arg(path, isSrc, dstDirMustExist, allowLocal=None):
    assert hdfsVirtualCluster is not None
    if hdfsPattern.match(path):
        path = path[len("hdfs://"):]
        if(path == ""):
            path = "/"
        logger.info("Path: " + path)
        fs = HadoopFs.HadoopFileSystem(hdfsVirtualCluster, simulateOnly, isVerbose, logger, hdfsUser, hdfsHost, hdfsPort)
    else:
        logger.info("Assuming local file system pattern: " + path)
        fs = LocalFs.LocalFileSystem(simulateOnly, isVerbose, logger)

    return fs, fs.make_fd(path, isSrc, dstDirMustExist)

def rm_command(args, recursive=False, force=False):
    exitCode = 0
    for arg in args:
        logger.info("RM ARG: path={0}".format(arg))
        try:
            fileSystem, fileDescriptor = process_arg(arg, isSrc=True, dstDirMustExist=False)
        except Errors.FileNotFound:
            print("Path not found: %s" % arg)
            exitCode = 3
            continue
        except Errors.Unauthorized:
            print("Insufficient privileges to access the path: %s" % arg)
            exitCode = 4
            continue

        try:
            fileSystem.delete_file_dir(fileDescriptor, recursive, force)
        except Errors.PathNotEmpty:
            print("Cannot delete a non empty directory without -r option")
            exitCode = 5
        except Errors.Unauthorized:
            print("Insufficient privileges to delete the path: %s" % fileDescriptor.abspath)
            exitCode = 4
        # Check if the path deleted
        if exitCode == 0:
            if isinstance(fileSystem, LocalFs.LocalFileSystem):
                return exitCode
            if not fileSystem.get_hdfs_file_dir_json(fileDescriptor.abspath) is None:
                print("Failed to remove %s" % fileDescriptor.abspath)
                exitCode = 6

    return exitCode

def mkdir_command(args):
    exitCode = 0
    for arg in args:
        logger.info("MKDIR ARG: path={0}".format(arg))
        folderExists = True
        try:
            fileSystem, fileDescriptor = process_arg(arg, isSrc=False, dstDirMustExist=False)
            folderExists = fileDescriptor.exists
        except Errors.FileNotFound:
            folderExists = False
        except Errors.Unauthorized:
            print("Insufficient privileges to access the folder: %s" % arg)
            exitCode = 4

        if not folderExists:
            try:
                fileSystem.make_dir(fileDescriptor.abspath)
            except Errors.Unauthorized:
                print("Insufficient privileges to create the folder: %s" % fileDescriptor.abspath)
                exitCode = 4
        # Check if the path exists
        if exitCode == 0:
            if isinstance(fileSystem, LocalFs.LocalFileSystem):
                return exitCode
            if fileSystem.get_hdfs_file_dir_json(fileDescriptor.abspath) is None:
                print("Failed to create %s" % fileDescriptor.abspath)
                exitCode = 6

    return exitCode


def mv_command(args):
    if len(args) < 2:
        print("cannot initiate move with only one argument")
        sys.exit(2)
    elif len(args) > 2:
        print("more than 2 arguments currently not supported")
        sys.exit(2)

    src = args[0]
    dst = args[1]

    logger.info("MOVE ARGS: src={0}, dst={1}".format(src, dst))

    try:
        srcFileSystem, srcFileDescriptor = process_arg(src, isSrc=True, dstDirMustExist=False)
    except Errors.FileNotFound:
        print("Source not found: %s" % src)
        return 3
    except Errors.Unauthorized:
        print("Insufficient privileges to access the source: %s" % src)
        return 4
    srcSize = srcFileDescriptor.size

    try:
        dstFileSystem, dstFileDescriptor = process_arg(dst, isSrc=False, dstDirMustExist=True)
    except Errors.FileNotFound:
        print("Destination not found: %s" % dst)
        return 3
    except Errors.Unauthorized:
        print("Insufficient privileges to access the destination: %s" % dst)
        return 4

    try:
        srcFileSystem.mv_file(srcFileDescriptor, dstFileDescriptor, dstFileSystem)
    except Errors.Unauthorized:
        print("Insufficient privileges to move the path: {0} -> {1}".format(
            srcFileDescriptor.abspath, dstFileDescriptor.abspath))
        return 4
    # Check if mv successes
    fileSystem, dstFileDescriptor = process_arg(dst, isSrc=True, dstDirMustExist=False)
    if srcSize != dstFileDescriptor.size or \
        not fileSystem.get_hdfs_file_dir_json(srcFileDescriptor.abspath) is None or \
        fileSystem.get_hdfs_file_dir_json(dstFileDescriptor.abspath) is None:
        print("Failed to move the path: {0} -> {1}".format(
            srcFileDescriptor.abspath, dstFileDescriptor.abspath))
        return 6

    return 0


def cp_command(args, recursive=False, force=False):
    global fileSystemWithMetrics
    if len(args) < 2:
        print("cannot initiate copy with only one argument")
        sys.exit(2)
    elif len(args) > 2:
        print("more than 2 arguments currently not supported")
        sys.exit(2)

    src = args[0]
    dst = args[1]

    logger.info("COPY ARGS: src={0}, dst={1}".format(src, dst))

    createTopLevelDir = True
    if src.endswith("*"):
        createTopLevelDir = False
        src = src[:-1]

    try:
        srcFileSystem, srcFileDescriptor = process_arg(src, isSrc=True, dstDirMustExist=False)
    except Errors.FileNotFound:
        print("Source not found: %s" % src)
        return 3
    except Errors.Unauthorized:
        print("Insufficient privileges to access the source: %s" % src)
        return 4

    try:
        dstFileSystem, dstFileDescriptor = process_arg(dst, isSrc=False, dstDirMustExist=True)
    except Errors.FileNotFound:
        print("Destination not found: %s" % dst)
        return 3
    except Errors.Unauthorized:
        print("Insufficient privileges to access the destination: %s" % dst)
        return 4

    exitCode = 0
    if srcFileDescriptor.is_file or srcFileDescriptor.is_symlink:
        try:
            srcFileSystem.cp_file(srcFileDescriptor, dstFileDescriptor, dstFileSystem, force)
        except Errors.Unauthorized:
            print("Insufficient privileges to copy the path: {0} -> {1}".format(
                srcFileDescriptor.abspath, dstFileDescriptor.abspath))
            exitCode = 4
        # Catch the error when copied destination file size mismatches with source file size
        except ValueError as error:
            print(error)
            exitCode = 6

    elif srcFileDescriptor.is_directory:
        assert dstFileDescriptor.is_directory
        if not recursive:
            print("cannot copy directories without recursive flag")
            return 2

        dstRootFileDescriptor = None
        for isNewDir, root, currentFile in srcFileSystem.fast_walk(srcFileDescriptor):
            if isNewDir:
                try:
                    dstRootFileDescriptor = dstFileSystem.make_dst_dir(
                        srcFileDescriptor,
                        dstFileDescriptor,
                        root,
                        createTopLevelDir)
                except Errors.Unauthorized:
                    print("Insufficient privileges to create the destination: {0}".format(
                        dstFileDescriptor.abspath))
                    exitCode = 4
                    continue

            try:
                srcFileSystem.cp_file(currentFile, dstRootFileDescriptor, dstFileSystem, force)
            except Errors.Unauthorized:
                print("Insufficient privileges to copy the path: {0} -> {1}".format(
                    srcFileDescriptor.abspath, dstFileDescriptor.abspath))
                exitCode = 4
            # Catch the error when copied destination file size mismatches with source file size
            except ValueError as error:
                print(error)
                exitCode = 6

    else:
        print("File does not exist, ignoring")
        exitCode = 3

    fileSystemWithMetrics = srcFileSystem

    return exitCode


def ls_print(itemList):
    size = 0
    print("total " + str(len(itemList)))
    for item in itemList:
        size += item.size
        print(("{desc} {numChild:>7,} {owner:>10} {group:>12} {size:>13,} {date} {name}".format(
            desc=item.file_descriptor,
            numChild=int(item.numChildren),
            owner=item.owner,
            group=item.group,
            size=item.size,
            date=item.modificationTime.strftime("%Y-%m-%d %H:%M:%S"),
            name=item.name)))

    print("\nsize {size:,} ".format(size=size))
    return size


def ls_command(args, recursive=False):
    exitCode=0
    for arg in args:
        logger.info("LS ARG: path={0}".format(arg))
        try:
            fileSystem, fileDescriptor = process_arg(arg, isSrc=True, dstDirMustExist=False)
        except Errors.FileNotFound:
            print("Path not found: %s" % arg)
            exitCode=3
            continue
        except Errors.Unauthorized:
            print("Insufficient privileges to access the path: %s" % arg)
            exitCode=4
            continue

        if fileDescriptor.is_directory:
            if recursive:
                totalSize = 0
                for root, dirs, files in fileSystem.walk(fileDescriptor):
                    print("\n" + root.abspath)
                    totalSize += ls_print(dirs + files)
                print("\ntotal size {size:,} ".format(size=totalSize))
            else:
                try:
                    itemList = list(fileSystem.list_dir(fileDescriptor))
                    ls_print(itemList)
                except Errors.Unauthorized:
                    print("Insufficient privileges to access the path: %s" % arg)
                    exitCode=4
                    continue
        else:
            ls_print([fileDescriptor])
    return exitCode


def hash_command(args):
    exitCode=0
    for arg in args:
        logger.info("HASH ARG: path={0}".format(arg))

        try:
            fileSystem, fileDescriptor = process_arg(arg, isSrc=True, dstDirMustExist=False)
        except Errors.FileNotFound:
            print("Path not found: %s" % arg)
            exitCode=3
            continue
        except Errors.Unauthorized:
            print("Insufficient privileges to access the path: %s" % arg)
            exitCode=4
            continue

        if fileDescriptor.is_directory:
            print("Cannot hash a directory" % arg)
            exitCode=2
            continue

        fileSystem.compute_hash(fileDescriptor)

    return exitCode

def config_command(args):
    exitCode = 0
    config = Config.Config()
    for arg in args:
        logger.info("CONFIG ARG: {0}".format(arg))

        try:
            config.storeConfig(arg)
        except Errors.FsException:
            print("Cannot store the config. Please make sure your configuration is correct")
            exitCode = 6
            continue

    return exitCode

if __name__ == "__main__":

    argParser = argparse.ArgumentParser(
        description="pai-fs command supported arguments:",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="\nexample use: \n\n\
  pai-fs -ls hdfs://                                         -- list the contents of a root HDFS directory \n\
  pai-fs -ls hdfs:// --host 10.0.3.9                         -- list the contents of a root HDFS directory with host specified \n\
  pai-fs -ls hdfs:// --host 10.0.3.9 --port 50070 --user root    -- list the contents of a root HDFS directory with host, port and user specified \n\
  pai-fs -ls -r hdfs://                                      -- list the contents of a root HDFS directory, recursively \n\
  pai-fs -mkdir hdfs://mydir/mysubdir/mysubdir2              -- makes mysubdir2 and all directories along the way \n\
  pai-fs -rm hdfs://mydir/mysubdir/myfile                    -- removes myfile from mysubdir \n\
  pai-fs -rm hdfs://mydir/mysubdir                           -- removes mysubdir and all files and directories in it \n\
  pai-fs -cp c:\mylocalfile hdfs://mydir/myremotedir         -- copy mylocalfile into myremotedir \n\
  pai-fs -cp -r c:\mylocaldir hdfs://mydir/myremotedir       -- copy mylocaldir into myremotedir, recursively \n\
  pai-fs -cp -r c:\mylocaldir\* hdfs://mydir/myremotedir     -- copy mylocaldir's contents into myremotedir, recursively \n\
  pai-fs -cp c:\mylocaldir\\a hdfs://mydir/myremotedir/b      -- copy file a from mylocaldir to myremotedir and rename to b \n\
  pai-fs -cp -r hdfs://mydir/myremotedir c:\mylocaldir       -- copy myremotedir into mylocaldir, recursively \n\
  pai-fs -cp -r hdfs://mydir/myremotedir/* c:\mylocaldir     -- copy myremotedir's contents into mylocaldir, recursively \n\
  pai-fs --hash hdfs://mydir/myfile                          -- get the sha1 hash of myfile \n\
  pai-fs --config host=10.0.3.9                              -- store hdfs config \n\
\nexit code: \n\n\
  0   -- Success \n\
  1   -- An exception happened during the operation including bad connection \n\
  2   -- PAI_VC environment variable not set to valid VC or insufficient/invalid command line argument(s) \n\
  3   -- Path not found \n\
  4   -- Unauthorized access \n\
  5   -- Path not empty \n\
  6   -- Check failed after operation \n\
  100 -- Failed to copy too many times \n\
  101 -- Failed to concat chunks into file \n\
    "
    )
    group = argParser.add_mutually_exclusive_group()
    group.add_argument("-ls", "--list", action="store_true", help="list a file or a directory metadata")
    group.add_argument("-cp", "--copy", action="store_true", help="copy file")
    group.add_argument("-rm", "--remove", action="store_true", help="remove a file or an empty directory")
    group.add_argument("-mkdir", "--makeDirectory", action="store_true", help="create a new directory (and others along the way)")
    group.add_argument("-mv", "--move", action="store_true", help="move/rename a file or directory")
    group.add_argument("--hash", action="store_true", help="sha1 hash a file")
    group.add_argument("--config", action="store_true", help="store config for pai-fs")
    argParser.add_argument("myArgs", nargs="+", help="files and directories to manipulate")
    argParser.add_argument("-r", "--recursive", action="store_true", default=False, help="recurse into subdirectories")
    argParser.add_argument("-v", "--verbose", action="store_true", default=True, help="verbose output of file operations")
    argParser.add_argument("-i", "--info", action="store_true", default=False, help="log all relevant information")
    argParser.add_argument("-d", "--debug", action="store_true", default=False, help="debug HDFS REST APIs")
    argParser.add_argument("-f", "--force", action="store_true", default=False, help="do not prompt for confirmation")
    argParser.add_argument("--user", help="the user of hdfs, use value in pai-fs.conf if not specified", type=str)
    argParser.add_argument("--host", help="the host ip of hdfs, use value in pai-fs.conf if not specified", type=str)
    argParser.add_argument("--port", help="the port of hdfs, use value in pai-fs.conf if not specified", type=str)
    cmdLineArgs = argParser.parse_args()

    if cmdLineArgs.verbose:
        isVerbose = True

    if cmdLineArgs.info:
        isDebug = True
        logging.basicConfig(level=logging.INFO)
    elif cmdLineArgs.debug:
        isDebug = True
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.ERROR)
        logging.getLogger("requests").setLevel(logging.ERROR)
        logging.getLogger("urllib3").setLevel(logging.ERROR)

    logger = logging.getLogger(__name__)

    if cmdLineArgs.user:
        hdfsUser = cmdLineArgs.user
    else:
        hdfsUser = None
    
    if cmdLineArgs.host:
        hdfsHost = cmdLineArgs.host
    else:
        hdfsHost = None
    
    if cmdLineArgs.port:
        hdfsPort = cmdLineArgs.port
    else:
        hdfsPort = None

    startTime = time.time()
    exitCode=0
    if cmdLineArgs.list:
        exitCode=ls_command(cmdLineArgs.myArgs, cmdLineArgs.recursive)
    elif cmdLineArgs.remove:
        exitCode=rm_command(cmdLineArgs.myArgs, cmdLineArgs.recursive, cmdLineArgs.force)
    elif cmdLineArgs.makeDirectory:
        exitCode=mkdir_command(cmdLineArgs.myArgs)
    elif cmdLineArgs.copy:
        exitCode=cp_command(cmdLineArgs.myArgs, cmdLineArgs.recursive, cmdLineArgs.force)
    elif cmdLineArgs.move:
        exitCode=mv_command(cmdLineArgs.myArgs)
    elif cmdLineArgs.hash:
        exitCode=hash_command(cmdLineArgs.myArgs)
    elif cmdLineArgs.config:
        config_command(cmdLineArgs.myArgs)

    if isVerbose:
        print("\nElapsed time: %s sec" % (time.time() - startTime))
        if fileSystemWithMetrics is not None:
            bytesPerSec = fileSystemWithMetrics.get_cp_rate()
            if bytesPerSec is not None:
                print("Effective copy rate was {rate:,} bytes per second".format(rate=int(bytesPerSec)))

    sys.exit(exitCode)
