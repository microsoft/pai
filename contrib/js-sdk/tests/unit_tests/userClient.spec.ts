/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as nock from 'nock';


import { expect } from 'chai';
import { UserClient } from '../../src/client/userClient'
import { IPAICluster } from '../../src/models/cluster'
import { testAllUsers } from '../common/test_data/testAllUsers';
import { testUserInfo } from '../common/test_data/testUserInfo';

const testUri = 'openpai-js-sdk.test/rest-server';
const realUri = '10.151.40.234/rest-server';

const cluster: IPAICluster = {
    password: 'test',
    rest_server_uri: testUri,
    username: 'test'
};
const userClient = new UserClient(cluster);

chai.use(dirtyChai);

describe('Get user infomation', () => {
    const response = testUserInfo;
    const userName = 'core';
    nock(`http://${testUri}`).get(`/api/v2/user/${userName}`).reply(200, response);

    it('should return the user info', async () => {
        const result = await userClient.get(userName);
        expect(result).to.be.eql(response);
    });
});

describe('Get all users', () => {
    const response = testAllUsers;
    nock(`http://${testUri}`).get(`/api/v2/user/`).reply(200, response);

    it('should return the user info', async () => {
        const result = await userClient.getAll();
        expect(result).is.not.empty();
    });
})

describe('Create a new user', () => {
    const response = { "message": "User is created successfully" };
    nock(`http://${testUri}`).post(`/api/v1/token`).reply(200, response);
    nock(`http://${testUri}`).post(`/api/v2/user/`).reply(201, response);

    it('should create a new user', async () => {
        const result = await userClient.create('core11', '11111111', false, '', ['default']);
        expect(result).to.be.eql(response);
    });
})