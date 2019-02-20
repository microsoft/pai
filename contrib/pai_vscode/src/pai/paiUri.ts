/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import * as querystring from 'querystring';

import { Util } from '../common/util';

import { IPAICluster } from './paiInterface';

export namespace PAIRestUri {
    const API_PREFIX: string = 'api/v1';

    export function getRestUrl(cluster: IPAICluster): string {
        let url: string = cluster.rest_server_uri;
        if (!url.endsWith('/')) {
            url += '/';
        }
        url += API_PREFIX;

        return Util.fixURL(url);
    }

    export function token(cluster: IPAICluster): string {
        return `${getRestUrl(cluster)}/token`;
    }

    export function jobDetail(cluster: IPAICluster, username: string, jobName: string): string {
        return `${getRestUrl(cluster)}/user/${username}/jobs/${jobName}`;
    }

    export function jobs(cluster: IPAICluster, username?: string): string {
        if (username) {
            return `${getRestUrl(cluster)}/user/${username}/jobs`;
        }
        return `${getRestUrl(cluster)}/jobs`;
    }
}

export namespace PAIWebPortalUri {
    export function getClusterWebPortalUri(conf: IPAICluster): string {
        return conf.web_portal_uri || conf.rest_server_uri.split(':')[0];
    }

    export function jobDetail(cluster: IPAICluster, username: string, jobName: string): string {
        return `${getClusterWebPortalUri(cluster)}/view.html?${querystring.stringify({
            username,
            jobName
        })}`;
    }

    export function jobs(cluster: IPAICluster, username?: string): string {
        if (username) {
            return `${getClusterWebPortalUri(cluster)}/view.html?${querystring.stringify({
                username
            })}`;
        }
        return `${getClusterWebPortalUri(cluster)}/view.html`;
    }
}