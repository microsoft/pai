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

import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as nock from 'nock';

import { expect } from 'chai';
import { UserClient } from '../../src/client/userClient';
import { IPAICluster } from '../../src/models/cluster';
import { testAllUsers } from '../common/test_data/testAllUsers';
import { testUserInfo } from '../common/test_data/testUserInfo';

const testUri = 'openpai-js-sdk.test/rest-server';

const cluster: IPAICluster = {
    password: 'test',
    rest_server_uri: testUri,
    username: 'test'
};
const userClient = new UserClient(cluster);

chai.use(dirtyChai);
nock(`http://${testUri}`).post(`/api/v1/token`).reply(200, { token: 'token' });

describe('Get user infomation', () => {
    const response = testUserInfo;
    const userName = 'core';
    nock(`http://${testUri}`).get(`/api/v2/user/${userName}`).reply(200, response);

    it('should return the user info', async () => {
        const result = await userClient.get(userName);
        expect(result).to.be.eql(response);
    });
});

describe('List all users', () => {
    const response = testAllUsers;
    nock(`http://${testUri}`).get(`/api/v2/user/`).reply(200, response);

    it('should return all users', async () => {
        const result = await userClient.list();
        expect(result).is.not.empty();
    });
});

describe('Create a new user', () => {
    const response = { "message": "User is created successfully" };
    nock(`http://${testUri}`).post(`/api/v2/user/`).reply(201, response);

    it('should create a new user', async () => {
        const result = await userClient.create('core11', '11111111', false, '', ['default']);
        expect(result).to.be.eql(response);
    });
});

describe('Update user extension data', () => {
    const response = { "message": "Update user extension data successfully." };
    const userName = 'core11';
    nock(`http://${testUri}`).put(`/api/v2/user/${userName}/extension`).reply(201, response);

    it('should update successfully', async () => {
        const result = await userClient.updateExtension(userName, {'ex1': 'ex2'});
        expect(result).to.be.eql(response);
    });
});

describe('Delete a user', () => {
    const response = { "message": "user is removed successfully" };
    const userName = 'core11';
    nock(`http://${testUri}`).delete(`/api/v2/user/${userName}`).reply(200, response);

    it('should delete successfully', async () => {
        const result = await userClient.delete(userName);
        expect(result).to.be.eql(response);
    });
});

describe('Update user virtualCluster data', () => {
    const response = { "message": "Update user virtualCluster data successfully." };
    const userName = 'core11';
    nock(`http://${testUri}`).put(`/api/v2/user/${userName}/virtualcluster`).reply(201, response);

    it('should update successfully', async () => {
        const result = await userClient.updateVirtualcluster(userName, ['default']);
        expect(result).to.be.eql(response);
    });
});

describe('Update user password', () => {
    const response = { "message": "update user password successfully." };
    const userName = 'core11';
    const newPassword = 'newPassword';
    nock(`http://${testUri}`).put(`/api/v2/user/${userName}/password`).reply(201, response);

    it('should update successfully', async () => {
        const result = await userClient.updatePassword(userName, undefined, newPassword);
        expect(result).to.be.eql(response);
    });
});
describe('Update user email', () => {
    const response = { "message": "Update user email data successfully." };
    const userName = 'core11';
    const newEmail = 'new@email.test';
    nock(`http://${testUri}`).put(`/api/v2/user/${userName}/email`).reply(201, response);

    it('should update successfully', async () => {
        const result = await userClient.updateEmail(userName, newEmail);
        expect(result).to.be.eql(response);
    });
});

describe('Update user admin permission', () => {
    const response = { "message": "Update user admin permission successfully." };
    const userName = 'core11';
    const newAdminPermission = false;
    nock(`http://${testUri}`).put(`/api/v2/user/${userName}/admin`).reply(201, response);

    it('should update successfully', async () => {
        const result = await userClient.updateAdminPermission(userName, newAdminPermission);
        expect(result).to.be.eql(response);
    });
});

describe('Update user group list', () => {
    const userName = 'core11';
    const newGroupList = ['newGroup1', 'newGroup2'];
    const response = { "message": "update user grouplist successfully." };
    nock(`http://${testUri}`).put(`/api/v2/user/${userName}/grouplist`).reply(201, response);

    it('should update successfully', async () => {
        const result = await userClient.updateGroupList(userName, newGroupList);
        expect(result).to.be.eql(response);
    });
});

describe('Add new group into user group list', () => {
    const userName = 'core11';
    const groupName = 'testGroup';
    const response = { "message": `User ${userName} is added into group ${groupName}` };
    nock(`http://${testUri}`).put(`/api/v2/user/${userName}/group`).reply(201, response);

    it('should add successfully', async () => {
        const result = await userClient.addGroup(userName, groupName);
        expect(result).to.be.eql(response);
    });
});

describe('Remove group from user group list', () => {
    const userName = 'core11';
    const groupName = 'testGroup';
    const response = { "message": `User ${userName} is removed from group ${groupName}` };
    nock(`http://${testUri}`).delete(`/api/v2/user/${userName}/group`).reply(201, response);

    it('should remove successfully', async () => {
        const result = await userClient.removeGroup(userName, groupName);
        expect(result).to.be.eql(response);
    });
});