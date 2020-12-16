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


class DevicePlugin:
    def __init__(self, cluster_conf, service_conf, default_service_conf):
        self.cluster_conf = cluster_conf
        self.service_conf = service_conf
        self.default_service_conf = default_service_conf

    # This function is used to find the all valid computing device types from `layout.yaml`
    def find_computing_device_types(self):
      computing_device_types = set()
      machine_sku_to_device_type = {
          sku_name: sku_attrs['computing-device']['type']
          for sku_name, sku_attrs in self.cluster_conf['machine-sku'].items()
          if 'computing-device' in sku_attrs
      }
      workers = list(filter(lambda elem: 'pai-worker' in elem and elem["pai-worker"] == 'true', self.cluster_conf['machine-list']))
      for worker in workers:
        if worker['machine-type'] in machine_sku_to_device_type:
          computing_device_type = machine_sku_to_device_type[worker['machine-type']]
          computing_device_types.add(computing_device_type)
      return list(computing_device_types)

    def validation_pre(self):
        if 'devices' not in self.service_conf:
            self.service_conf['devices'] = self.default_service_conf['devices']
        return True, None

    def run(self):
        # add computing device from `layout.yaml`
        for computing_device in self.find_computing_device_types():
            if computing_device not in self.service_conf['devices']:
                self.service_conf['devices'].append(computing_device)
        return self.service_conf

    def validation_post(self, conf):
        return True, None
