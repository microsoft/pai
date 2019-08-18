/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as yaml from 'js-yaml';
import * as request from 'request-promise-native';

import { Util } from '../commom/util';
import { IPAICluster } from '../models/cluster';
import { IJobConfig, IJobInfo, IJobStatusV1, IJobSshInfo } from '../models/job';
import { OpenPAIBaseClient } from './baseClient';

/**
 * OpenPAI Job client.
 */
export class JobClient extends OpenPAIBaseClient {
    constructor(cluster: IPAICluster) {
        super(cluster)
    }

    /**
     * List jobs, will call /api/v1/jobs.
     * @param query The query string.
     */
    public async list(query?: string): Promise<IJobStatusV1[]> {
        const url = query === undefined ?
            Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/jobs`) :
            Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/jobs?${query}`) ;
        return await request.get(url);
    }

    /**
     * Get job info, will call /api/v2/jobs/{userName}~{jobName}.
     * @param userName The user name.
     * @param jobName The job name.
     */
    public async get(userName: string, jobName: string): Promise<IJobInfo> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/jobs/${userName}~${jobName}`);
        const res = await request.get(url);
        return JSON.parse(res);
    }

    /**
     * Get job config, will call /api/v2/jobs/{userName}~{jobName}/config.
     * @param userName The user name.
     * @param jobName The job name.
     */
    public async getConfig(userName: string, jobName: string): Promise<IJobConfig> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/jobs/${userName}~${jobName}/config`);
        const res = await request.get(url);
        return yaml.safeLoad(res);
    }

    /**
     * Submit a job. will call /api/v2/jobs.
     * @param jobConfig The job config.
     */
    public async submit(jobConfig: IJobConfig, token?: string): Promise<void> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/jobs`);
        const text = yaml.safeDump(jobConfig);
        if(token === undefined) {
            token = await super.token();
        }
        await request.post(url, {
                body: text,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'text/yaml'
                },
                timeout: OpenPAIBaseClient.TIMEOUT
            }
        );
    }

    /**
     * Get job SSH infomation.
     * @param userName The user name.
     * @param jobName The job name.
     */
    public async getSshInfo(userName: string, jobName: string): Promise<IJobSshInfo> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/user/${userName}/jobs/${jobName}/ssh`);
        const res = await request.get(url);
        return JSON.parse(res);
    }
}
