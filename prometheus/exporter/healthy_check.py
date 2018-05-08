#!/usr/bin/python
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