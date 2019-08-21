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
import { VirtualClusterClient } from '../../src/client/virtualClusterClient';
import { IPAICluster } from '../../src/models/cluster';
import { testAllVirtualClusters } from '../common/test_data/testAllVirtualClusters';
import { testNodeResources } from '../common/test_data/testNodeResources';
import { testVirtualClusters } from '../common/test_data/testVirtualCluster';

const testUri = 'openpai-js-sdk.test/rest-server';
const realUri = '10.151.40.234/rest-server';

const cluster: IPAICluster = {
    password: 'test',
    rest_server_uri: testUri,
    username: 'test'
};
const virtualClusterClient = new VirtualClusterClient(cluster);

chai.use(dirtyChai);
nock(`http://${testUri}`).post(`/api/v1/token`).reply(200, { token: 'token' });

describe('List all virtual clusters', () => {
    const response = testAllVirtualClusters;
    nock(`http://${testUri}`).get(`/api/v2/virtual-clusters`).reply(200, response);

    it('should return all virtual clusters', async () => {
        const result = await virtualClusterClient.list();
        expect(result).to.be.eql(response);
    });
});

describe('Get a virtual cluster', () => {
    const response = testVirtualClusters;
    const vcName = 'default';
    nock(`http://${testUri}`).get(`/api/v2/virtual-clusters/${vcName}`).reply(200, response);

    it('should return the virtual cluster info', async () => {
        const result = await virtualClusterClient.get(vcName);
        expect(result).to.be.eql(response);
    });
});

describe('Get virtual cluster node resources', () => {
    const response = testNodeResources;
    nock(`http://${testUri}`).get(`/api/v2/virtual-clusters/nodeResource`).reply(200, response);

    it('should return the virtual cluster info', async () => {
        const result = await virtualClusterClient.getNodeResource();
        expect(result).to.be.eql(response);
    });
});

describe('Create a new virtual cluster', () => {
    const vcName = 'testNewVc1';
    const vcCapacity = 1;
    const response = { "message": `create vc: ${vcName} to capacity: ${vcCapacity} successfully.` };
    nock(`http://${testUri}`).put(`/api/v1/virtual-clusters/${vcName}`).reply(201, response);

    it('should return the virtual cluster info', async () => {
        const result = await virtualClusterClient.createOrUpdate(vcName, vcCapacity, vcCapacity);
        expect(result).to.be.eql(response);
    });
});

describe('Remove a virtual cluster', () => {
    const vcName = 'testNewVc1';
    const response = { "message": `Remove vc: ${vcName} successfully` };
    nock(`http://${testUri}`).delete(`/api/v1/virtual-clusters/${vcName}`).reply(201, response);

    it('should remove successfully', async () => {
        const result = await virtualClusterClient.delete(vcName);
        expect(result).to.be.eql(response);
    });
});

describe('Change virtual cluster status', () => {
    const vcName = 'testNewVc1';
    const vcStatus = 'stopped';
    const response = { "message": `stop vc ${vcName} successfully` };
    nock(`http://${testUri}`).put(`/api/v1/virtual-clusters/${vcName}/status`).reply(201, response);

    it('should remove successfully', async () => {
        const result = await virtualClusterClient.changeStatus(vcName, vcStatus);
        expect(result).to.be.eql(response);
    });
});
