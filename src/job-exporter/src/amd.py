from dataclasses import dataclass
import json
import logging
import subprocess

import utils

LOGGER = logging.getLogger(__name__)


@dataclass
class AMDGpuStatus:
    gpu_util: float
    gpu_mem_util: float
    uuid: str
    temperature: float
    pci_addr: str


def rocm_smi(histogram, timeout):
    try:
        smi_output = utils.exec_cmd(
            ["rocm-smi", "--showmeminfo", "all", "-a", "--json"],
            histogram=histogram,
            timeout=timeout)

        return parse_smi_json_result(smi_output)
    except subprocess.CalledProcessError as e:
        LOGGER.exception("command '%s' return with error (code %d): %s", e.cmd,
                         e.returncode, e.output)
    except subprocess.TimeoutExpired:
        LOGGER.warning("rocm-smi timeout")
    except Exception:
        LOGGER.exception("exec rocm-smi error")

    return None


def parse_smi_json_result(smi_output):
    """ return a map, key is PCI bus index, value is AMDGpuStatus """
    res = {}
    output = json.loads(smi_output)
    gpu_infos = [v for k, v in output.items() if k.startswith("card")]
    values = sorted(gpu_infos, key=lambda v: v["PCI Bus"])
    for index, value in enumerate(values):
        gpu_util = float(value["GPU use (%)"])
        gpu_mem_vram_total = float(value["vram Total Memory (B)"])
        gpu_mem_vram_used = float(value["vram Total Used Memory (B)"])
        gpu_mem_vram_util = gpu_mem_vram_used / gpu_mem_vram_total * 100
        gpu_temperature = float(value["Temperature (Sensor edge) (C)"])
        gpu_uuid = str(value["Unique ID"]).strip()
        pci_addr = value["PCI Bus"]
        res[str(index)] = AMDGpuStatus(gpu_util, gpu_mem_vram_util, gpu_uuid,
                                       gpu_temperature, pci_addr)

    return res
