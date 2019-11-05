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
import { ILoginInfo } from '../models/authn';
import { IPAICluster, IPAIClusterInfo } from '../models/cluster';
import { ITokenItem } from '../models/token';

/**
 * OpenPAI basic client.
 */
export class OpenPAIBaseClient {
    protected static readonly TIMEOUT: number = 60 * 1000;
    protected cluster: IPAICluster;

    private cacheToken?: ITokenItem;

    constructor(cluster: IPAICluster) {
        this.cluster = cluster;
    }

    /**
     * Get OpenPAI access token, will call /api/v1/token.
     */
    public async token(): Promise<string> {
        if (!this.cacheToken || this.cacheToken.expireTime < Date.now()) {
            const res = await this.login();
            this.cacheToken = {
                expireTime: Date.now() + 3600 * 1000,
                token: res.token
            }
        }
        return this.cacheToken!.token;
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
     * Get OpenPAI cluster info, will call /api/v1.
     */
    public async getClusterInfo(): Promise<IPAIClusterInfo> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/`);
        const res = await request.get(url);
        return JSON.parse(res);
    }
}