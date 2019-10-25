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


class TestNbExtCfg(OrderedUnitTestCase):

    settings = dict(cpu=100, gpu=-2, mem='90g')

    def step1_init(self):
        from openpaisdk.notebook import NotebookConfiguration
        NotebookConfiguration.print_supported_items()

    def step2_setup(self):
        from openpaisdk.notebook import NotebookConfiguration
        from openpaisdk import LayeredSettings
        NotebookConfiguration.set(**self.settings)
        for key in self.settings.keys():
            LayeredSettings.update('user_basic', key, -1)

    def step3_check(self):
        from openpaisdk.notebook import NotebookConfiguration
        to_screen(NotebookConfiguration.get())
        dic = {k: NotebookConfiguration.get(k) for k in self.settings}
        self.assertDictEqual(dic, self.settings)

    @seperated
    def test_nbext_configuration(self):
        self.run_steps()
