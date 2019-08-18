/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as request from 'request-promise-native';

import { Util } from '../commom/util';
import { IPAICluster } from '../models/cluster';
import { ITokenItem } from '../models/token';

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
            const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/token`);
            const res = await request.post(url, {
                form: {
                    expiration: 4000,
                    password: this.cluster.password,
                    username: this.cluster.username
                },
                json: true,
                timeout: OpenPAIBaseClient.TIMEOUT
            });
            this.cacheToken = {
                expireTime: Date.now() + 3600 * 1000,
                token: res.token
            }
        }
        return this.cacheToken!.token;
    }
}