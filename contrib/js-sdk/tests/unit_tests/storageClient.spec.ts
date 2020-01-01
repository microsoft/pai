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
import { StorageClient } from '../../src/client/storageClient';
import { IPAICluster } from '../../src/models/cluster';
import { IStorage, IStorageConfig } from '../../src/models/storage';

const testUri = 'openpai-js-sdk.test/rest-server';

const cluster: IPAICluster = {
    https: true,
    rest_server_uri: testUri,
    token: 'token',
};
const storageClient = new StorageClient(cluster);

chai.use(dirtyChai);
nock(`http://${testUri}`).post(`/api/v1/authn/basic/login`).reply(200, { token: 'token' });

describe('Get storage infomation by storage name', () => {
    const response: IStorage = {
        'data': {
            'test': 'test'
        },
        'extension': {},
        'spn': 'test',
        'type': 'azureblob'
    };
    const testName = 'testStorage';
    nock(`https://${testUri}`).get(`/api/v2/storage/server/${testName}`).reply(200, response);

    it('should return the storage info', async () => {
        const result = await storageClient.getByName(testName);
        expect(result).to.be.eql(response);
    });
});

describe('Get storage information list', () => {
    const response: IStorage[] = [{
        'data': {
            'test': 'test'
        },
        'extension': {},
        'spn': 'test',
        'type': 'azureblob'
    }];
    nock(`https://${testUri}`).get(`/api/v2/storage/server`).reply(200, response);

    it('should return the storage info', async () => {
        const result = await storageClient.get();
        expect(result).to.be.eql(response);
    });
});

describe('Get storage config by storage name', () => {
    const response: IStorage = {
        'data': {
            'test': 'test'
        },
        'extension': {},
        'spn': 'test',
        'type': 'azureblob'
    };
    const testName = 'testStorage';
    nock(`https://${testUri}`).get(`/api/v2/storage/config/${testName}`).reply(200, response);

    it('should return the storage info', async () => {
        const result = await storageClient.getConfigByName(testName);
        expect(result).to.be.eql(response);
    });
});

describe('Get storage config list', () => {
    const response: IStorageConfig[] = [
        {
            "name": "PAI_SHARE",
            "default": true,
            "servers": [
                "PAI_SHARE_SERVER"
            ],
            "mountInfos": [
                {
                    "mountPoint": "/data",
                    "path": "data",
                    "server": "PAI_SHARE_SERVER",
                    "permission": "rw"
                },
                {
                    "mountPoint": "/home",
                    "path": "users/${PAI_USER_NAME}",
                    "server": "PAI_SHARE_SERVER",
                    "permission": "rw"
                }
            ]
        }
    ]
    nock(`https://${testUri}`).get(`/api/v2/storage/config`).reply(200, response);

    it('should return the storage info', async () => {
        const result = await storageClient.getConfig();
        expect(result).to.be.eql(response);
    });
});
