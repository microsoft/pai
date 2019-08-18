/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as request from 'request-promise-native';

import { Util } from '../commom/util';
import { IPAICluster } from '../models/cluster';
import { IUserInfo } from '../models/user';
import { OpenPAIBaseClient } from './baseClient';

/**
 * OpenPAI Job client.
 */
export class UserClient extends OpenPAIBaseClient {
    constructor(cluster: IPAICluster) {
        super(cluster)
    }

    /**
     * Get user information.
     * @param userName The user name.
     * @param token Specific an access token (optional).
     */
    public async get(userName: string, token?: string): Promise<IUserInfo> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await request.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return JSON.parse(res);
    }

    /**
     * Get all users.
     * @param token Specific an access token (optional).
     */
    public async getAll(token?: string): Promise<IUserInfo[]> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await request.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return JSON.parse(res);
    }

    /**
     * Create a new user.
     * @param username username in [\w.-]+ format.
     * @param password password at least 6 characters.
     * @param admin true | false.
     * @param email email address or empty string.
     * @param virtualCluster ["vcname1 in [A-Za-z0-9_]+ format", "vcname2 in [A-Za-z0-9_]+ format"].
     * @param extension { "extension-key1": "extension-value1" }.
     * @param token Specific an access token (optional).
     */
    public async create(
        username: string,
        password: string,
        admin: boolean,
        email: string,
        virtualCluster: string[],
        extension?: {},
        token?: string
    ) {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await request.post(url, {
            body: JSON.stringify({username, email, password, admin, virtualCluster, extension}),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return JSON.parse(res);
    }
}