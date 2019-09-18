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
