/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as nock from 'nock';


import { expect } from 'chai';
import { OpenPAIBaseClient } from '../../src/client/baseClient'
import { IPAICluster } from '../../src/models/cluster'

const testUri = 'openpai-js-sdk.test/rest-server';

const cluster: IPAICluster = {
    password: 'test',
    rest_server_uri: testUri,
    username: 'test'
};
const baseClient = new OpenPAIBaseClient(cluster);

chai.use(dirtyChai);

describe('Get token', () => {
    const response = {
        token: 'eyJhb...'
    };
    nock(`http://${testUri}`).post(`/api/v1/token`).reply(200, response);

    it('should return a token', async () => {
        const result = await baseClient.token();
        expect(result).to.be.a('string');
    });
});

describe('Get cluster info', () => {
    const response = {
        authnMethod: "basic",
        launcherType: "yarn",
        name: "PAI RESTful API",
        version: "v0.14.0"
    };
    nock(`http://${testUri}`).get(`/api/v1/`).reply(200, response);

    it('should return the cluster info', async () => {
        const result = await baseClient.getClusterInfo();
        expect(result).to.be.eql(response);
    });
});