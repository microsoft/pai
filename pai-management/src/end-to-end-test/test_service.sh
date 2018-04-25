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


service_list="$(kubectl get pods)"


@test "check etcd server" {
  [[ $service_list == *"etcd-server"!(*$'\n'*)"Running"* ]]
}

@test "check drivers" {
  [[ $service_list == *"drivers-one-shot"!(*$'\n'*)"Running"* ]]
}

@test "check hadoop name node" {
  [[ $service_list == *"hadoop-name-node-ds"!(*$'\n'*)"Running"* ]]
}

@test "check hadoop data node" {
  [[ $service_list == *"hadoop-data-node-ds"!(*$'\n'*)"Running"* ]]
}

@test "check hadoop resource manager" {
  [[ $service_list == *"hadoop-resource-manager-ds"!(*$'\n'*)"Running"* ]]
}

@test "check hadoop node manager" {
  [[ $service_list == *"hadoop-node-manager-ds"!(*$'\n'*)"Running"* ]]
}

@test "check hadoop job history" {
  [[ $service_list == *"hadoop-jobhistory-service"!(*$'\n'*)"Running"* ]]
}

@test "check zookeeper" {
  [[ $service_list == *"zookeeper-ds"!(*$'\n'*)"Running"* ]]
}

@test "check frameworklauncher" {
  [[ $service_list == *"frameworklauncher-ds"!(*$'\n'*)"Running"* ]]
}

@test "check rest server" {
  [[ $service_list == *"rest-server-ds"!(*$'\n'*)"Running"* ]]
}

@test "check webportal" {
  [[ $service_list == *"webportal-ds"!(*$'\n'*)"Running"* ]]
}
