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
import { testJobConfig } from '../common/test_data/testJobConfig';
import { testJobInfo } from '../common/test_data/testJobInfo';
import { testJobList } from '../common/test_data/testJobList';
import { testJobSshInfo } from '../common/test_data/testJobSshInfo';

const testUri = 'openpai-js-sdk.test/rest-server';
const realUri = '10.151.40.234/rest-server';

const cluster: IPAICluster = {
    password: 'PhillyOnAzure001',
    rest_server_uri: testUri,
    username: 'core'
};
const jobClient = new JobClient(cluster);

chai.use(dirtyChai);

describe('List jobs', () => {
    const response = testJobList;
    nock(`http://${testUri}`).get(`/api/v1/jobs`).reply(200, response);

    it('should return a list of jobs', async () => {
        const result = await jobClient.list();
        expect(result).is.not.empty();
    }).timeout(10000);
});

describe('List jobs with query', () => {
    const response = testJobList;
    const queryString = 'username=core';
    nock(`http://${testUri}`).get(`/api/v1/jobs?${queryString}`).reply(200, response);

    it('should return a list of jobs', async () => {
        const result = await jobClient.list(queryString);
        expect(result).is.not.empty();
    }).timeout(10000);
});

describe('Get job info', () => {
    const response = testJobInfo;
    const userName = 'core';
    const jobName = 'tensorflow_serving_mnist_2019_6585ba19';
    nock(`http://${testUri}`).get(`/api/v2/jobs/${userName}~${jobName}`).reply(200, response);


    it('should return the job information', async () => {
        const result = await jobClient.get(userName, jobName);
        expect(result).to.be.eql(response);
    });
})

describe('Get job config', () => {
    const response = testJobConfig;
    const userName = 'core';
    const jobName = 'tensorflow_serving_mnist_2019_6585ba19';
    nock(`http://${testUri}`).get(`/api/v2/jobs/${userName}~${jobName}/config`).reply(200, response);

    it('should return a job config', async() => {
        const result = await jobClient.getConfig(userName, jobName);
        expect(result).to.be.eql(response);
    });
});

describe('Submit a job', () => {
    const jobConfig = testJobConfig;
    const response = {
        token: 'eyJhb...'
    };
    nock(`http://${testUri}`).post(`/api/v1/token`).reply(200, response);
    nock(`http://${testUri}`).post(`/api/v2/jobs`).reply(200);

    it('should submit a job without exception', async() => {
        await jobClient.submit(jobConfig);
    })
});

describe('Get job ssh infomation', () => {
    const response = testJobSshInfo;
    const userName = 'core';
    const jobName = 'tensorflow_serving_mnist_2019_6585ba19';
    nock(`http://${testUri}`).get(`/api/v1/user/${userName}/jobs/${jobName}/ssh`).reply(200, response);

    it('should return the job ssh info', async() => {
        const result = await jobClient.getSshInfo(userName, jobName);
        expect(result).to.be.eql(response);
    });
});