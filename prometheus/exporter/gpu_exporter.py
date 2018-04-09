#!/usr/bin/python
import subprocess
import sys
from xml.dom import minidom

def parse_xml(smi, logDir):
    xmldoc = minidom.parseString(smi)
    gpuList = xmldoc.getElementsByTagName('gpu')
    print(len(gpuList))
    gpu_count = len(gpuList)
    print("gpu numbers" + str(gpu_count))
    nvidiasmi_attached_gpus = "nvidiasmi_attached_gpus" + "{} " + str(gpu_count) 
    outputFile = open(logDir + "gpu_exporter.prom", "w")
    outputFile.write(nvidiasmi_attached_gpus + "\n")
    for gpu in gpuList:
        minorNumber = gpu.getElementsByTagName('minor_number')[0].childNodes[0].data
        gpuUtil = gpu.getElementsByTagName('utilization')[0].getElementsByTagName('gpu_util')[0].childNodes[0].data.replace("%", "")
        gpuMemUtil = gpu.getElementsByTagName('utilization')[0].getElementsByTagName('memory_util')[0].childNodes[0].data.replace("%", "")
        outputFile.write('nvidiasmi_utilization_gpus{{minor_number={0}}} {1}\n'.format(str(minorNumber), str(gpuUtil)))
        outputFile.write('nvidiasmi_utilization_memory{{minor_number={0}}} {1}\n'.format(str(minorNumber), str(gpuMemUtil)))

def main(argv):
    print(argv) 
    logDir = argv[0]
    test = argv[1]

    try:
        nvidia_smi_path = "nvidia-smi "
        nvidia_smi_query = "-q -x"
        smi_output = subprocess.check_output([nvidia_smi_path, nvidia_smi_query])
        parse_xml(smi_output, logDir)
    except subprocess.CalledProcessError as e:
        raise RuntimeError("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

# execute test cmd example: python .\gpu_exporter.py ./ True
if __name__ == "__main__":
    main(sys.argv[1:])