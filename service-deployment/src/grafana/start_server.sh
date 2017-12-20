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


# Variables illustrate:
# ${UPGRADEALL}, ${GF_PLUGIN_DIR}, ${GF_PATHS_DATA} & ${GF_PATHS_LOGS}, defined in dockerfile.


# upgrade all installed plugins
if [ "$UPGRADEALL" = true ] ; then
    grafana-cli --pluginsDir "${GF_PLUGIN_DIR}" plugins upgrade-all || true
fi

exec /usr/sbin/grafana-server   \
  --homepath=/usr/share/grafana              \
  --config=/etc/grafana/grafana.ini          \
  cfg:default.paths.data=${GF_PATHS_DATA}    \
  cfg:default.paths.logs=${GF_PATHS_LOGS}    \
  cfg:default.paths.plugins=${GF_PLUGIN_DIR} \
  "$@"

