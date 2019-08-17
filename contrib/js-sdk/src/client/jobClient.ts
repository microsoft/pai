/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as request from 'request-promise-native';

import { Util } from '../commom/util';
import { IPAICluster } from '../models/cluster';
import { IJobStatusV1 } from '../models/job';

/**
 * OpenPAI Job client.
 */
export class JobClient {
    private cluster: IPAICluster;

    constructor(cluster: IPAICluster) {
        this.cluster = cluster;
    }

    /**
     * List jobs, will call /api/v1/jobs
     */
    public async list(): Promise<IJobStatusV1[]> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/jobs`);
        return await request.get(url);
    }
}
