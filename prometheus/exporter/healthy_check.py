#!/usr/bin/python
import subprocess
import sys
import os
import logging  
from logging.handlers import RotatingFileHandler
logger = logging.getLogger("gpu_expoter")  
logger.setLevel(logging.INFO)  
fh = RotatingFileHandler("/datastorage/prometheus/gpu_exporter_readiness_probe.log", maxBytes= 1024 * 1024 * 100, backupCount=5)  
fh.setLevel(logging.INFO)  
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")  
fh.setFormatter(formatter)  
logger.addHandler(fh)  

def main(argv):
    runTimeException = []
    gpuExists = False
    try:
        gpuCheckCMD = "lspci | grep -E \"[0-9a-fA-F][0-9a-fA-F]:[0-9a-fA-F][0-9a-fA-F].[0-9] (3D|VGA compatible) controller: NVIDIA Corporation*\""
        gpu_output = subprocess.check_output([gpuCheckCMD], shell=True)
        if gpu_output:
            gpuExists = True
    except subprocess.CalledProcessError as e:
        err = "command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output)
        runTimeException.append(err)
        logging.info(err)

    if gpuExists:
        try:
            env =  os.getenv("NV_DRIVER")
            if not env:
                nvidiaCMD= "/bin/nvidia-smi -q -x"
                smi_output = subprocess.check_output([nvidiaCMD], shell=True)
            else:
                err = "nvidia env is null"
                runTimeException.append(err)
        except subprocess.CalledProcessError as e:
            err = "command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output)
            runTimeException.append(err)
            logging.info(err)

    try:
        dockerInspectCMD = "docker inspect --help" 
        dockerDockerInspect = subprocess.check_output([dockerInspectCMD], shell=True)
    except subprocess.CalledProcessError as e:
        err = "command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output)
        runTimeException.append(err)
        logging.info(err)

    try:
        dockerStatsCMD = "docker stats --no-stream --format \"table {{.ID}}, {{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}},{{.MemPerc}}\""
        dockerDockerStats = subprocess.check_output([dockerStatsCMD], shell=True)
    except subprocess.CalledProcessError as e:
        err = "command '{}' return with error (code {}): {}".format(e.cmd, e.returncode, e.output)
        runTimeException.append(err)
        logging.info(err)

    if not os.path.exists("/datastorage/prometheus/gpu_exporter.prom"):
        err = "/datastorage/prometheus/gpu_exporter.prom does not exists"
        runTimeException.append(err)
        logging.info(err)

    if not os.path.exists("/datastorage/prometheus/job_exporter.prom"):
        err = "/datastorage/prometheus/job_exporter.prom does not exists"
        runTimeException.append(err)
        logging.info(err)

    if len(runTimeException) > 0:
        raise RuntimeError("gpu-exporter readiness probe failed")

if __name__ == "__main__":
    main(sys.argv[1:])