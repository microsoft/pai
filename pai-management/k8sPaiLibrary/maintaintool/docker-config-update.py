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

import sys
import json
import argparse

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument('-s', '--src-json', dest="src_json", required=True,
                        help="The json with the data you wanna write")
    parser.add_argument('-d', '--dst-json', dest="dst_json", required=True,
                        help="The json with the data you wanna update")
    args = parser.parse_args()

    with open(args.src_json, "r") as jsonFile:
        src_data = json.load(jsonFile)

    with open(args.dst_json, "r") as jsonFile:
        dst_data = json.load(jsonFile)

    for conf_key in src_data:
        dst_data[conf_key] = src_data[conf_key]
        changed = True

    with open(args.dst_json, 'w') as jsonFile:
        json.dump(dst_data, jsonFile)
