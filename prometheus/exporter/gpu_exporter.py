#!/usr/bin/python
import subprocess
import sys

def parse_smi(smi, logDir):
    print("nvidia-smi results")
    print(smi)
    data = [line.split(',') for line in smi.splitlines()]
    # pop the headers
    data.pop(0)
    gpu_count = len(data)
    print("gpu numbers" + str(gpu_count))
    nvidiasmi_attached_gpus = "nvidiasmi_attached_gpus" + "{} " + str(gpu_count) 
    outputFile = open(logDir + "gpu_exporter.prom", "w")
    outputFile.write(nvidiasmi_attached_gpus + "\n")
    index = 0

    for gpu_object in data:
        nvidiasmi_utilization_gpus = "nvidiasmi_utilization_gpus" + "{minor_number=" + str(index) + "}" + " " + str(gpu_object[1])
        nvidiasmi_utilization_memory = "nvidiasmi_utilization_memory" + "{minor_number=" + str(index) + "}" + " " + str(gpu_object[2]) 
        index += 1
        outputFile.write(nvidiasmi_utilization_memory + "\n")
        outputFile.write(nvidiasmi_utilization_gpus + "\n")
    
    outputFile.close()

def main(argv):
    print(argv) 
    logDir = argv[0]

    try:
        nvidia_smi_path = "nvidia-smi "
        nvidia_smi_query = "--query-gpu=uuid,utilization.gpu,utilization.memory "
        nvidia_smi_format = "--format=csv,nounits "
        smi_output = subprocess.check_output([nvidia_smi_path, nvidia_smi_query, nvidia_smi_format])
        parse_smi(smi_output, logDir)
    except subprocess.CalledProcessError as e:
        raise RuntimeError("command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output))

# execute test cmd example: python .\gpu_exporter.py ./ 
if __name__ == "__main__":
    main(sys.argv[1:])