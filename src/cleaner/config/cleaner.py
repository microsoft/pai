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


import logging
import logging.config
import copy

class Cleaner(object):

    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.logger = logging.getLogger(__name__)
        self.cluster_conf = cluster_conf
        self.service_conf = service_conf
        self.default_service_conf = default_service_conf

    def validation_pre(self):
        return True, None

    def run(self):
        result = copy.deepcopy(self.default_service_conf)
        result.update(self.service_conf)
        return result

    def validation_post(self, conf):
        threshold = conf["cleaner"].get("threshold")
        if type(threshold) != int:
            msg = "expect threshold in cleaner to be int but get %s with type %s" % \
                    (threshold, type(threshold))
            return False, msg
        else:
            if threshold < 0 or threshold > 100:
                msg = "expect threshold in [0, 100]"
                return False, msg
            
        interval = conf["cleaner"].get("interval")
        if type(interval) != int:
            msg = "expect interval in cleaner to be int but get %s with type %s" % \
                    (interval, type(interval))
            return False, msg
        
        return True, None

