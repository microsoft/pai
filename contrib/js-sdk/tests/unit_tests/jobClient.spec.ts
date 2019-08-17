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

chai.use(dirtyChai);

describe('List jobs', () => {
    const response = [{
        "appExitCode": 0,
        "completedTime": 1563499887777,
        "createdTime": 1563499625106,
        "executionType": "STOP",
        "name": "sklearn-mnist_2019-07-19_01-26-40",
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
        "username": "core",
        "virtualCluster": "default"
    }];

    const testUri = 'openpai-js-sdk.test/rest-server';
    nock(`http://${testUri}`).get(`/api/v1/jobs`).reply(200, response);

    const cluster: IPAICluster = {
        password: 'test',
        rest_server_uri: testUri,
        username: 'test'
    };
    const jobClient = new JobClient(cluster);

    it('should return a list of jobs', async () => {
        const result = await jobClient.list();
        expect(result).is.not.empty().that.eql(response);
    });
});