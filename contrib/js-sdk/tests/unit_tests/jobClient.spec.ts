/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as nock from 'nock';

import { expect } from 'chai';
import { JobClient } from '../../src/client/jobClient'
import { IPAICluster } from '../../src/models/cluster'
import { IJobConfig } from '../../src/models/job';

const testUri = 'openpai-js-sdk.test/rest-server';
const realUri = '10.151.40.234/rest-server';

const cluster: IPAICluster = {
    password: 'test',
    rest_server_uri: realUri,
    username: 'test'
};
const jobClient = new JobClient(cluster);

chai.use(dirtyChai);

describe('List jobs', () => {
    const response = [{
        "appExitCode": 0,
        "completedTime": 1563499887777,
        "createdTime": 1563499625106,
        "executionType": "STOP",
        "name": "sklearn-mnist",
        "retries": 0,
        "retryDetails": {
            "platform": 0,
            "resource": 0,
            "user": 0
        },
        "state": "SUCCEEDED",
        "subState": "FRAMEWORK_COMPLETED",
        "totalGpuNumber": 0,
        "totalTaskNumber": 1,
        "totalTaskRoleNumber": 1,
        "username": "test",
        "virtualCluster": "default"
    }];
    nock(`http://${testUri}`).get(`/api/v1/jobs`).reply(200, response);

    it('should return a list of jobs', async () => {
        const result = await jobClient.list();
        expect(result).is.not.empty();
    }).timeout(10000);
});

describe('Get job config', () => {
    const response: IJobConfig = {
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
    const userName = 'core';
    const jobName = 'tensorflow_serving_mnist_2019_6585ba19';
    nock(`http://${testUri}`).get(`/api/v2/jobs/${userName}~${jobName}/config`).reply(200, response);

    it('should return a job config', async() => {
        const result = await jobClient.get(userName, jobName);
        expect(result).to.be.eql(response);
    });
});