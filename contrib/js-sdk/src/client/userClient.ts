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
            }
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
            }
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
    ): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await request.post(url, {
            body: JSON.stringify({username, email, password, admin, virtualCluster, extension}),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return JSON.parse(res);
    }

    /**
     * Update user extension data.
     * @param userName The user name.
     * @param extension The new extension.
     * {
     *   "extension": {
     *      "key-you-wannat-add-or-update-1": "value1",
     *      "key-you-wannat-add-or-update-2": {...},
     *      "key-you-wannat-add-or-update-3": [...]
     * }
     * @param token Specific an access token (optional).
     */
    public async updateExtension(userName: string, extension: {}, token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}/extension`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await this.sendPutRequestWithToken(url, {extension}, token);

        return JSON.parse(res);
    }

    /**
     * Delete a user.
     * @param userName The user name.
     * @param token Specific an access token (optional).
     */
    public async delete(userName: string, token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await request.delete(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return JSON.parse(res);
    }

    /**
     * Update user's virtual cluster.
     * @param userName The user name.
     * @param virtualCluster The new virtualCluster.
     * {
     *    "virtualCluster": ["vcname1 in [A-Za-z0-9_]+ format", "vcname2 in [A-Za-z0-9_]+ format"]
     * }
     * @param token Specific an access token (optional).
     */
    public async updateVirtualcluster(userName: string, virtualCluster: string[], token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}/virtualcluster`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await this.sendPutRequestWithToken(url, {virtualCluster}, token);
        return JSON.parse(res);
    }

    /**
     * Update user's password.
     * @param userName The user name.
     * @param oldPassword password at least 6 characters, admin could ignore this params.
     * @param newPassword password at least 6 characters.
     * @param token Specific an access token (optional).
     */
    public async updatePassword(userName: string, oldPassword?: string, newPassword?: string, token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}/password`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await this.sendPutRequestWithToken(url, {oldPassword, newPassword}, token);
        return JSON.parse(res);
    }

    /**
     * Update user's email.
     * @param userName The user name.
     * @param email The new email.
     * @param token Specific an access token (optional).
     */
    public async updateEmail(userName: string, email: string, token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}/email`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await this.sendPutRequestWithToken(url, {email}, token);
        return JSON.parse(res);
    }

    /**
     * Update user's admin permission.
     * @param userName The user name.
     * @param admin true | false.
     * @param token Specific an access token (optional).
     */
    public async updateAdminPermission(userName: string, admin: boolean, token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}/admin`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await this.sendPutRequestWithToken(url, {admin}, token);
        return JSON.parse(res);
    }

    /**
     * Update user's group list.
     * @param userName The user name.
     * @param grouplist The new group list.
     * @param token Specific an access token (optional).
     */
    public async updateGroupList(userName: string, grouplist: string[], token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}/grouplist`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await this.sendPutRequestWithToken(url, {grouplist}, token);
        return JSON.parse(res);
    }

    /**
     * Add group into user's group list.
     * @param userName The user name.
     * @param groupname The new groupname in [A-Za-z0-9_]+ format.
     * @param token Specific an access token (optional).
     */
    public async addGroup(userName: string, groupname: string, token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}/group`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await this.sendPutRequestWithToken(url, {groupname}, token);
        return JSON.parse(res);
    }

    /**
     * Remove group from user's group list.
     * @param userName The user name.
     * @param groupname The groupname in [A-Za-z0-9_]+ format.
     * @param token Specific an access token (optional).
     */
    public async removeGroup(userName: string, groupname: string, token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/user/${userName}/group`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await request.delete(url, {
            body: JSON.stringify({groupname}),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return JSON.parse(res);
    }

    private async sendPutRequestWithToken(url: string, body: {}, token: string): Promise<any> {
        return await request.put(url, {
            body: JSON.stringify(body),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }
}