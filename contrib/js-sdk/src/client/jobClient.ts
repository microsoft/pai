/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as yaml from 'js-yaml';
import * as request from 'request-promise-native';

import { Util } from '../commom/util';
import { IPAICluster } from '../models/cluster';
import { IJobConfig, IJobStatusV1 } from '../models/job';

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

    /**
     * Get job config, will call /api/v2/jobs/{userName}~{jobName}/config.
     * @param userName The user name.
     * @param jobName The job name.
     */
    public async get(userName: string, jobName: string): Promise<IJobConfig> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/jobs/${userName}~${jobName}/config`);
        const res = await request.get(url);
        return yaml.safeLoad(res);
    }
}
