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

if [ $# -ne 2 ]; then
  echo "Usage: bash -x <this-script.sh> <path-to-package-cache-info> <os-type>"
  exit 1
else
  package_cache_info=$1
  os_type=$2
fi

apt-get update
ROOT_DIR=/package_cache
mkdir -p $ROOT_DIR

i=0
package_dirs=()

while IFS= read -r line || [[ -n "$line" ]] ;
do
  start_char=`echo $line | cut -b 1`
  if [ ! "$start_char" == "#" ]; then
    name=`echo $line | cut -d , -f 1`
    os=`echo $line | cut -d , -f 2`
    packages=`echo $line | cut -d , -f 3`
    if [ "$os" = "$os_type" ]; then
      echo "name: ${name} os: ${os} packages: ${packages}"
      package_dir=$ROOT_DIR"/${name}-${os}"
      package_dirs[$i]=$package_dir
      let i++
      mkdir -p $package_dir
      cd $package_dir
      echo $packages > ./packages
      apt-get -y install --print-uris ${packages} | cut -d " " -f 1-2 | grep http:// > /aptinfo && \
      cat /aptinfo | cut -d\' -f 2 > ./urls && \
      apt-get -y install ${packages} --dry-run &> /dry_run_log && \
      cat /dry_run_log  | grep Conf | cut -d " " -f 2 > ./order
      if [ $? -ne 0 ]; then
        echo 'There is an error during package collection.'
        exit 1
      fi
    fi
  fi
done < $package_cache_info  

apt-get -y install wget

for package_dir in ${package_dirs[@]};do
  cd $package_dir
  wget -i ./urls --tries 3 -P ./ && \
  ls -la *.deb | awk '{print $9}' | while read filename; do mv $filename `echo $filename | cut -d "_" -f1`".deb"; done;
  if [ $? -ne 0 ]; then
    echo 'There is an error during package collection.'
    exit 1
  fi
done