/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as querystring from 'querystring';
import * as request from 'request-promise-native';

import { Util } from '../common/util';

import { IPAICluster } from './paiInterface';

export namespace PAIRestUri {
    const API_PREFIX: string = 'api/v1';

    export function getRestUrl(cluster: IPAICluster, apiPrefix?: string): string {
        let url: string = cluster.rest_server_uri;
        if (!url.endsWith('/')) {
            url += '/';
        }
        if (apiPrefix) {
            url += apiPrefix;
        } else {
            url += API_PREFIX;
        }

        return Util.fixURL(url);
    }

    export function token(cluster: IPAICluster, apiPrefix?: string): string {
        return `${getRestUrl(cluster, apiPrefix)}/token`;
    }

    export function jobDetail(cluster: IPAICluster, username: string, jobName: string, apiPrefix?: string): string {
        return `${getRestUrl(cluster, apiPrefix)}/user/${username}/jobs/${jobName}`;
    }

    export function jobs(cluster: IPAICluster, username?: string, apiPrefix?: string): string {
        if (username) {
            return `${getRestUrl(cluster)}/user/${username}/jobs`;
        }
        return `${getRestUrl(cluster, apiPrefix)}/jobs`;
    }
}

export namespace PAIWebPortalUri {
    export function getClusterWebPortalUri(conf: IPAICluster): string {
        return conf.web_portal_uri || conf.rest_server_uri.split(':')[0];
    }

    export async function isOldJobLinkAvailable(cluster: IPAICluster): Promise<boolean> {
        const link: string = `${getClusterWebPortalUri(cluster)}/view.html`;
        try {
            await request.get(Util.fixURL(link));
            return true;
        } catch {
            return false;
        }
    }

    export async function jobDetail(cluster: IPAICluster, username: string, jobName: string): Promise<string> {
        const oldLink: boolean = await isOldJobLinkAvailable(cluster);
        return `${getClusterWebPortalUri(cluster)}/${oldLink ? 'view' : 'job-detail'}.html?${querystring.stringify({
            username,
            jobName
        })}`;
    }

    export async function jobs(cluster: IPAICluster): Promise<string> {
        const oldLink: boolean = await isOldJobLinkAvailable(cluster);
        return `${getClusterWebPortalUri(cluster)}/${oldLink ? 'view' : 'job-list'}.html`;
    }
}