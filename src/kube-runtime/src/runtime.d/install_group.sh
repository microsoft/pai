#!/bin/bash

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

PAI_WORK_DIR=/usr/local/pai
CACHE_ROOT_DIR=${PAI_WORK_DIR}/package_cache

function is_ubuntu_package_installed(){
  for package in $1
  do
    dpkg -V $package &> /dev/null
    if [ $? -ne 0 ]; then
      return 1
    fi
  done
  return 0
}

if [ $# -ne 1 ]; then
  echo "Usage: bash -x install_group.sh <group_name>"
  exit 1
else
  name=$1
fi

if cat /etc/issue | grep "Ubuntu 16.04" &> /dev/null ; then
  os='ubuntu16.04'
elif cat /etc/issue | grep "Ubuntu 18.04" &> /dev/null ; then
  os='ubuntu18.04'
else
  echo "[package_cache] This os doesn't support package cache!"
  exit 1
fi
if [ -d $CACHE_ROOT_DIR"/${name}-${os}" ]; then
  package_dir=$CACHE_ROOT_DIR"/${name}-${os}"
  packages=`cat ${package_dir}"/packages"`
  is_ubuntu_package_installed "${packages}"
  if [ $? -eq 0 ]; then
    echo "[package_cache] Skip installation of group ${name}."
    exit 0
  fi
  if [ `getconf LONG_BIT` -eq 64 ]; then
    echo "[package_cache] Install group ${name} from cache ${package_dir}."
    cat ${package_dir}"/order" | while read file; do dpkg -i ${package_dir}"/"$file".deb"; done;
    apt-get install -f
    # check if packages are installed
    is_ubuntu_package_installed "${packages}"
    if [ $? -eq 0 ]; then
      echo "[package_cache] Install group ${name} from cache ${package_dir} succeeded!"
    else
      echo "[package_cache] Install group ${name} from cache ${package_dir} failed. Fallback to apt-get."
      apt-get update
      apt-get install -y ${packages}
    fi
  else
    echo "[package_cache] 32-Bit OS is not supported! Fallback to apt-get."
    apt-get update
    apt-get install -y ${packages}
  fi
else
  echo "Cannot find dependency ${name}-${os}!"
  exit 1
fi 
