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

#!/bin/bash

# This script parse the result of "docker system df" command to get the total reclaimable disk space.
# This command will list the reclaimable space of all docker objects including images, local volumes and build caches.
# Following is a example of the command's output:
# TYPE                TOTAL               ACTIVE              SIZE                RECLAIMABLE
# Images              38                  18                  16.13GB             11.26GB (69%)
# Containers          42                  42                  95.3MB              0B (0%)
# Local Volumes       13                  1                   3.553GB             3.28GB (92%)
# Build Cache         0                   0                   0B                  0B
#
# We summer up the result in column 5 (RECLAIMABLE) and return the size in gigabytes.

docker system df | \
gawk 'BEGIN {s=0}
      END {print s}
      match($5, /([0-9]+\.?[0-9]*)(M|G|B)/, a) {
          if(a[2] == "M")
              s += a[1]/1024;
          else if(a[2] == "B")
              s += a[1]/1024/1024;
          else
              s += a[1];
      }'
