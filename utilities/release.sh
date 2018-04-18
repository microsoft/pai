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


# Script for release

set -e

master_branch=master

read -p "Enter release tag: " version_tag

# Pull latest master branch
git checkout $master_branch
git pull origin $master_branch

# Create and push tag
git tag -a $version_tag -m "release version $(sed 's/^v//g' <<< $version_tag)"
git push origin $version_tag
echo "tagged with $version_tag"

# Create and push a corresponding branch
git branch pai-$(sed -r 's/^v//g; s/\.([^\.]*)$/.y/g' <<< $version_tag) $version_tag
git push origin pai-$(sed -r 's/^v//g; s/\.([^\.]*)$/.y/g' <<< $version_tag)
echo "created branch pai-$(sed -r 's/^v//g; s/\.([^\.]*)$/.y/g' <<< $version_tag)"
