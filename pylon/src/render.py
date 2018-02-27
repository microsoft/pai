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

import os
from jinja2 import Template

templateString = open('nginx.conf.template', 'r').read()
renderedString = Template(templateString).render({
    "REST_SERVER_URI": os.environ['REST_SERVER_URI'],
    "K8S_API_SERVER_URI": os.environ['K8S_API_SERVER_URI'],
    "WEBHDFS_URI": os.environ['WEBHDFS_URI'],
    "PROMETHEUS_URI": os.environ['PROMETHEUS_URI'],
    "K8S_DASHBOARD_URI": os.environ['K8S_DASHBOARD_URI'],
    "GRAFANA_URI": os.environ['GRAFANA_URI'],
    "WEBPORTAL_URI": os.environ['WEBPORTAL_URI']
})
open('nginx.conf', 'w').write(renderedString)
