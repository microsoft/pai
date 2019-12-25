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

cluster_type="$1"
cluster_scale="$2"

dev_box_name="dev-box-${cluster_type}-${cluster_scale}"

# Work in dev-box
sudo docker exec -i ${dev_box_name} /bin/bash << EOF_DEV_BOX
set -Eeuxo pipefail
cd /root/pai

# 1. delete PAI services
echo -e "Y\npai\n" | python paictl.py service delete

# 2. cleanup k8s
echo "Y" | python paictl.py cluster k8s-clean -p /cluster-configuration -f
EOF_DEV_BOX

sudo docker rm -f ${dev_box_name}
