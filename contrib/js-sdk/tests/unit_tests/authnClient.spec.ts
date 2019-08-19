/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as nock from 'nock';

import { expect } from 'chai';
import { AuthnClient } from '../../src/client/authnClient';
import { IAuthnInfo } from '../../src/models/authn';
import { IPAICluster } from '../../src/models/cluster';

const testUri = 'openpai-js-sdk.test/rest-server';
const realUri = '10.151.40.234/rest-server';

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
        "authn_type": "basic",
        "loginURI": "/api/v1/authn/basic/login",
        "loginURIMethod": "post"
    };
    nock(`http://${testUri}`).get(`/api/v1/authn/info`).reply(200, response);

    it('should return the user info', async () => {
        const result = await authnClient.info();
        expect(result).to.be.eql(response);
    });
});