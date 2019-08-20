/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

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