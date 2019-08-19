/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as request from 'request-promise-native';

import { Util } from '../commom/util';
import { IAuthnInfo } from '../models/authn';
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
}