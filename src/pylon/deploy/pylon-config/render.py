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
from hashlib import md5
from jinja2 import Template

env = {}
for key in os.environ:
    env[key] = os.environ[key]

templateString = open('/pylon-config/nginx.conf.template', 'r').read()
locationCfgTemplateString = open('/pylon-config/location.conf.template', 'r').read()

env.setdefault('PYLON_CONF_ETAG', md5(templateString).hexdigest())

renderedString = Template(templateString).render(env)
open('/root/nginx.conf', 'w').write(renderedString)

locationCfgRenderedString = Template(locationCfgTemplateString).render(env)
open('/root/location.conf', 'w').write(locationCfgRenderedString)