#!/usr/bin/env bats

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


hdfs_host=$HADOOP_VIP
paifs_arg="--host $hdfs_host --port 50070 --user root"


@test "list hdfs root dir" {
  result="$(python pai/pai-fs/pai-fs.py $paifs_arg -ls hdfs://)"
  [[ $result == *Launcher* ]]
}

@test "make hdfs test root dir" {
  result="$(python pai/pai-fs/pai-fs.py $paifs_arg -mkdir hdfs://Test)"
  [[ ! $result == *Error* ]]
  result="$(python pai/pai-fs/pai-fs.py $paifs_arg -ls hdfs://)"
  [[ $result == *Test* ]]
}

@test "make hdfs test sub dir" {
  result="$(python pai/pai-fs/pai-fs.py $paifs_arg -mkdir hdfs://Test/launcher)"
  [[ ! $result == *Error* ]]
  result="$(python pai/pai-fs/pai-fs.py $paifs_arg -mkdir hdfs://Test/cntk)"
  [[ ! $result == *Error* ]]
}

@test "upload cntk data to hdfs" {
  result="$(python pai/pai-fs/pai-fs.py $paifs_arg -cp -r -f CNTK/Examples/SequenceToSequence/CMUDict/Data hdfs://Test/cntk/)"
  [[ ! $result == *Error* ]]
  result="$(python pai/pai-fs/pai-fs.py $paifs_arg -cp -r -f CNTK/Examples/SequenceToSequence/CMUDict/BrainScript hdfs://Test/cntk/)"
  [[ ! $result == *Error* ]]
}

@test "upload cntk start script to hdfs" {
  result="$(python pai/pai-fs/pai-fs.py $paifs_arg -cp -f etc/cntk.sh hdfs://Test/cntk/BrainScript/)"
  [[ ! $result == *Error* ]]
}
