// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { IJobConfig, IJobConfigV1 } from '../../../src/models/job';

export const testJobConfig: IJobConfig = {
    "contributor": "OpenPAI",
    "description": "# Serving a TensorFlow MNIST Digit Recognition Model\n" +
        "This example shows you how to use TensorFlow Serving components to export a trained TensorFlow model\n" +
        "and use the standard tensorflow_model_server to serve it on OpenPAI.\n" +
        "This example uses the simple Softmax Regression model introduced in the TensorFlow tutorial for handwritten image (MNIST data) classification.\n" +
        "Reference https://www.tensorflow.org/tfx/serving/serving_basic.\n",
    "name": "tensorflow_serving_mnist_2019_6585ba19_test",
    "parameters": {
        "modelPath": "/tmp/mnist_model"
    },
    "prerequisites": [
        {
            "contributor": "OpenPAI",
            "description": "This is an [example TensorFlow Serving Docker image on OpenPAI](https://github.com/Microsoft/pai/tree/master/examples/serving).\n",
            "name": "tf_serving_example",
            "protocolVersion": 2,
            "type": "dockerimage",
            "uri": "openpai/pai.example.tensorflow-serving",
            "version": "1.0-r1.4"
        }
    ],
    "protocolVersion": 2,
    "taskRoles": {
        "worker": {
            "commands": [
                "bazel-bin/tensorflow_serving/example/mnist_saved_model <% $parameters.modelPath %>",
                "tensorflow_model_server --port=$PAI_CONTAINER_HOST_model_server_PORT_LIST --model_name=mnist --model_base_path=<% $parameters.modelPath %>"
            ],
            "dockerImage": "tf_serving_example",
            "instances": 1,
            "resourcePerInstance": {
                "cpu": 4,
                "gpu": 1,
                "memoryMB": 8192,
                "ports": {
                    "model_server": 1
                }
            }
        }
    },
    "type": "job",
    "version": 1
};

export const testJobConfigV1: IJobConfigV1 = {
    // Name for the job, need to be unique
    "jobName": "test_job_20190819",

    // URL pointing to the Docker image for all tasks in the job
    "image": "aiplatform/pai.build.base",

    // Code directory existing on HDFS.
    // Full HDFS path will be exported as an environment variable $PAI_CODE_DIR.
    "codeDir": "$PAI_DEFAULT_FS_URI/$PAI_USER_NAME/$PAI_JOB_NAME",

    // Data directory existing on HDFS.
    // Full HDFS path will be exported as an environment variable $PAI_DATA_DIR.
    "dataDir": "$PAI_DEFAULT_FS_URI/Data/$PAI_JOB_NAME",

    // Output directory on HDFS, $PAI_DEFAULT_FS_URI/Output/$jobName will be used if
    // not specified.
    // Full HDFS path will be exported as an environment variable $PAI_OUTPUT_DIR.
    "outputDir": "$PAI_DEFAULT_FS_URI/Output/$PAI_JOB_NAME",

    // List of taskRole, one task role at least
    "taskRoles": [
        {
            // Name for the task role, need to be unique with other roles
            "name": "task",

            // Number of tasks for the task role, no less than 1
            "taskNumber": 1,

            // CPU number for one task in the task role, no less than 1
            "cpuNumber": 1,

            // GPU number for one task in the task role, no less than 0
            "gpuNumber": 0,

            // Memory for one task in the task role, no less than 100
            "memoryMB": 1000,

            // Executable command for tasks in the task role, can not be empty
            // ** PLEASE CHANGE MANUALLY **
            "command": "python $PAI_JOB_NAME/<start up script>"
        }
    ]
}