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


# unable to handle list in list or dict in list.
# Such as [ a, b, [c, d], e ]
# Such as [ a, b, {k1:c, k2:d}, e ]
def dict_overwrite(subset_dict, superset_dict):
    if subset_dict == None:
        return False
    updated = False
    for key in subset_dict:
        if key not in superset_dict:
            superset_dict[key] = subset_dict[key]
            updated = True
        elif isinstance(subset_dict[key], dict) and isinstance(superset_dict[key], dict):
            if dict_overwrite(subset_dict[key], superset_dict[key]) is True:
                updated = True
        elif isinstance(subset_dict[key], list) and isinstance(superset_dict[key], list):
            if set(subset_dict[key]) != set(superset_dict[key]):
                superset_dict[key] = subset_dict[key]
                updated = True
        elif subset_dict[key] != superset_dict[key]:
            superset_dict[key] = subset_dict[key]
            updated = True
    return updated


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

    if dict_overwrite(src_data, dst_data) is False:
        sys.exit(1)

    with open(args.dst_json, 'w') as jsonFile:
        json.dump(dst_data, jsonFile)
