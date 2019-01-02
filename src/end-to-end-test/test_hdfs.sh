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


hdfs_uri=$HDFS_URI


@test "list hdfs root dir" {
  result="$(hdfs dfs -ls $hdfs_uri/)"
  [[ $result == *Launcher* ]]
}

@test "make hdfs test root dir" {
  result="$(hdfs dfs -mkdir $hdfs_uri/Test)"
  [[ ! $result == *mkdir* ]]
  result="$(hdfs dfs -ls $hdfs_uri/)"
  [[ $result == *Test* ]]
}

@test "make hdfs test sub dir" {
  result="$(hdfs dfs -mkdir $hdfs_uri/Test/launcher)"
  [[ ! $result == *mkdir* ]]
  result="$(hdfs dfs -mkdir $hdfs_uri/Test/tensorflow)"
  [[ ! $result == *mkdir* ]]
}

@test "upload cifar10 tensorflow test data to hdfs" {
  result="$(hdfs dfs -put -f cifar-10-batches-py $hdfs_uri/Test/tensorflow/)"
  [[ ! $result == *put* ]]
}

@test "upload tensorflow script to hdfs" {
  result="$(hdfs dfs -put -f benchmarks $hdfs_uri/Test/tensorflow/)"
  [[ ! $result == *put* ]]
}

@test "hdfs test root dir chmod" {
  result="$(hdfs dfs -chmod -R 777 $hdfs_uri/Test)"
  [[ ! $result == *chmod* ]]
}
