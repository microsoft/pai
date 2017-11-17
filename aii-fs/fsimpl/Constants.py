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

# Values used for testing
# DEFAULT_COPY_CHUNK_SIZE = 128 * 1024  # 128 KB
# DEFAULT_BIG_FILE_THRESHOLD = DEFAULT_COPY_CHUNK_SIZE * 2  # 256 KB

# Production values

# Big file threshold: 16GB is too big, and easy to fail, so decrease its size to 8GB
# DEFAULT_COPY_CHUNK_SIZE can't be changed, or not Python's shellutil.filecopyobj will crash
DEFAULT_COPY_CHUNK_SIZE = 128 * 1024 * 1024  # 128 MB
DEFAULT_BIG_FILE_THRESHOLD = DEFAULT_COPY_CHUNK_SIZE * 64  # 8 GB
