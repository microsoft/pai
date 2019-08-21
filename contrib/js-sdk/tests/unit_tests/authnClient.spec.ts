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
import { AuthnClient } from '../../src/client/authnClient';
import { IAuthnInfo } from '../../src/models/authn';
import { IPAICluster } from '../../src/models/cluster';

const testUri = 'openpai-js-sdk.test/rest-server';
const realUri = '10.151.40.234/rest-server';
const aadUri = '10.151.40.254/rest-server';

const cluster: IPAICluster = {
    password: 'test',
    rest_server_uri: testUri,
    username: 'test'
};
const authnClient = new AuthnClient(cluster);

chai.use(dirtyChai);
nock(`http://${testUri}`).post(`/api/v1/token`).reply(200, { token: 'token' });

describe('Get authn infomation', () => {
    const response: IAuthnInfo = {
        'authn_type': 'basic',
        'loginURI': '/api/v1/authn/basic/login',
        'loginURIMethod': 'post'
    };
    nock(`http://${testUri}`).get(`/api/v1/authn/info`).reply(200, response);

    it('should return the user info', async () => {
        const result = await authnClient.info();
        expect(result).to.be.eql(response);
    });
});

describe('Basic login', () => {
    const response = {
        'admin': true,
        'hasGitHubPAT': false,
        'token': 'token',
        'user': 'test'
    };
    nock(`http://${testUri}`).post(`/api/v1/authn/basic/login`).reply(200, response);

    it('should return the login info', async () => {
        const result = await authnClient.login();
        expect(result).to.be.eql(response);
    });
});

describe('OIDC login', () => {
    it('should return something', async () => {
        nock(`http://${testUri}`).get(`/api/v1/authn/oidc/login`).reply(200, 'test');
        const result = await authnClient.oidcLogin();

        expect(result).to.be.a('string');
    })
});

describe('OIDC logout', () => {
    it('should return something', async () => {
        nock(`http://${testUri}`).get(`/api/v1/authn/oidc/logout`).reply(200, 'test');
        const result = await authnClient.oidcLogout();

        expect(result).to.be.a('string');
    })
});
