import os
import sys
import unittest

sys.path.append(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src"))
import amd

PACKAGE_DIRECTORY_COM = os.path.dirname(os.path.abspath(__file__))

class TestAmd(unittest.TestCase):
    def setUp(self):
        try:
            os.chdir(PACKAGE_DIRECTORY_COM)
        except OSError:
            pass

    def test_parse_rocm_smi_result(self):
        sample_path = "data/rocm_smi.json"
        with open(sample_path, "r") as f:
            rocm_smi_result = f.read()
        rocm_smi_parse_result = amd.parse_smi_json_result(rocm_smi_result)
        expect = [{
            "pci_addr": "0000:03:00.0",
            "temperature": 31
        }, {
            "pci_addr": "0000:06:00.0",
            "temperature": 25
        }]
        for e, v in zip(expect, rocm_smi_parse_result.values()):
            self.assertEqual(e["pci_addr"], v.pci_addr)
            self.assertEqual(e["temperature"], v.temperature)


if __name__ == '__main__':
    unittest.main()
