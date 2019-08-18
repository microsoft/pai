/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IJobConfig } from '../../../src/models/job';

export const testJobConfig: IJobConfig = {
    "contributor": "OpenPAI",
    "description": "# Serving a TensorFlow MNIST Digit Recognition Model\n" +
        "This example shows you how to use TensorFlow Serving components to export a trained TensorFlow model\n" +
        "and use the standard tensorflow_model_server to serve it on OpenPAI.\n" +
        "This example uses the simple Softmax Regression model introduced in the TensorFlow tutorial for handwritten image (MNIST data) classification.\n" +
        "Reference https://www.tensorflow.org/tfx/serving/serving_basic.\n",
    "name": "tensorflow_serving_mnist_2019_6585ba19",
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