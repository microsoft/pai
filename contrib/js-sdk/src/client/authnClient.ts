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

import * as request from 'request-promise-native';

import { Util } from '../commom/util';
import { IAuthnInfo, ILoginInfo } from '../models/authn';
import { IPAICluster } from '../models/cluster';
import { OpenPAIBaseClient } from './baseClient';

/**
 * OpenPAI Authn client.
 */
export class AuthnClient extends OpenPAIBaseClient {
    private authnInfo?: IAuthnInfo;

    constructor(cluster: IPAICluster) {
        super(cluster)
    }

    /**
     * Get authn information.
     */
    public async info(): Promise<IAuthnInfo> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/authn/info`);
        if(this.authnInfo === undefined) {
            this.authnInfo = JSON.parse(await request.get(url));
        }

        return this.authnInfo!;
    }

    /**
     * Basic login.
     */
    public async login(): Promise<ILoginInfo> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/authn/basic/login`);
        const res = await request.post(url, {
            form: {
                expiration: 4000,
                password: this.cluster.password,
                username: this.cluster.username
            },
            json: true,
            timeout: OpenPAIBaseClient.TIMEOUT
        });

        return res;
    }

    /**
     * OpenID Connect login.
     */
    public async oidcLogin(queryString?: string): Promise<any> {
        const url = queryString ?
            Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/authn/oidc/login?${queryString}`) :
            Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/authn/oidc/login`);
        const res = await request.get(url);

        return res;
    }

    /**
     * OpenID Connect logout.
     */
    public async oidcLogout(queryString?: string): Promise<any> {
        const url = queryString ?
            Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/authn/oidc/logout?${queryString}`) :
            Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/authn/oidc/logout`);
        const res = await request.get(url);

        return res;
    }
}