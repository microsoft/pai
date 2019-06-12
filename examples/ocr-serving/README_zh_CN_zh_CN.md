<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

# OCR serving on PAI

This example introduces how to run an OCR serving job on OpenPAI,

Please note that it's a simple demo, don't use it directly in production environments.

## Prepare Docker image

To provide a more simple experience, we have prepared an image of `openpai/pai.example.ocr-serving`, you could also prepare your own image with following steps.

1. Build a base Docker image to pack necessary basic libraries for OpenPAI. We prepared a [base Dockerfile](../Dockerfiles/cuda9.0-cudnn7/Dockerfile.build.base) which can be built directly.

```bash
    $ cd ../Dockerfiles/cuda9.0-cudnn7
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda9.0-cudnn7-devel-ubuntu16.04 .
    $ cd -
    ```

2. Prepare the OCR serving Docker image, which includes OCR and web-server libraries. 
    It can be built with following command.

    ```
    $ sudo docker build -f Dockerfile.example.ocr-serving -t pai.example.ocr-serving .
    ```

    Then push the Docker image to a Docker registry:

    ```bash
    $ sudo docker tag pai.example.ocr-serving USER/pai.example.ocr-serving
    $ sudo docker push USER/pai.example.ocr-serving
    ```
    Please replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.



## Submit job

To use the OCR demo docker image on OpenPAI, you will need to submit a job with the command to config the port for the OCR web-server and start the service in docker. 

The full OCR job description is shown as below：
```json
{
  "jobName": "ocr-serving",
  "image": "openpai/pai.example.ocr-serving",
  "taskRoles": [
    {
      "name": "serving",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 0,
      "portList": [
        {
          "label": "model_server",
          "beginAt": 0,
          "portNumber": 1
        }
      ],
      "command": "python3 app.py -p $PAI_CONTAINER_HOST_model_server_PORT_LIST"
    }
  ],
  "retryCount": -2
}
```

*For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/user/training.md).*

After submitting this job, it might take few mins for OpenPAI to load docker image and deploy the service.

## Access service

OpenPAI will dynamic allocate resources, IP and Port for jobs. Dynamic allocated IP and Port can be found in the job detail page, with which users could access the web-server