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


from basic_test import OrderedUnitTestCase, seperated
from openpaisdk import to_screen


class TestJobResource(OrderedUnitTestCase):

    def test_job_resource_parser(self):
        from openpaisdk.job import JobResource
        from openpaisdk import __flags__
        self.assertDictEqual(__flags__.resources_requirements, JobResource(None).as_dict)
        self.assertDictEqual(__flags__.resources_requirements, JobResource().as_dict)
        self.assertDictEqual(__flags__.resources_requirements, JobResource({}).as_dict)
        dic = dict(cpu=-1, gpu=-2, memoryMB=-1024)
        for key, value in dic.items():
            self.assertEqual(value, JobResource(dic).as_dict[key])
        dic['mem'] = '-2gb'
        self.assertEqual(-2048, JobResource(dic).as_dict["memoryMB"])
        dic['mem'] = '-3g'
        self.assertEqual(-3072, JobResource(dic).as_dict["memoryMB"])
        dic['mem'] = 10240
        self.assertEqual(10240, JobResource(dic).as_dict["memoryMB"])
        self.assertEqual({"a": 1}, JobResource(dic).add_port("a").as_dict["ports"])

    def test_job_resource_list(self):
        from openpaisdk.job import JobResource
        samples = {
            "3,3,3g": dict(gpu=3, cpu=3, memoryMB=3072, ports={}),
            "3,1, 2g": dict(gpu=3, cpu=1, memoryMB=2048, ports={}),
        }
        keys = list(samples.keys())
        rets = JobResource.parse_list(keys)
        for k, r in zip(keys, rets):
            self.assertDictEqual(r, samples[k])
