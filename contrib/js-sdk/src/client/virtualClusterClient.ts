// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import * as request from 'request-promise-native';

import { Util } from '../commom/util';
import { IPAICluster } from '../models/cluster';
import { INodeResource, IVirtualCluster } from '../models/virtualCluster';
import { OpenPAIBaseClient } from './baseClient';

/**
 * OpenPAI Virtual Cluster client.
 */
export class VirtualClusterClient extends OpenPAIBaseClient {
    constructor(cluster: IPAICluster) {
        super(cluster)
    }

    /**
     * list all virtual clusters.
     */
    public async list(): Promise<{[id: string]: IVirtualCluster}> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/virtual-clusters`);
        const res = await request.get(url);
        return JSON.parse(res);
    }

    /**
     * get a virtual cluster.
     * @param vcName The name of virtual cluster.
     */
    public async get(vcName: string): Promise<IVirtualCluster> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/virtual-clusters/${vcName}`);
        const res = await request.get(url);
        return JSON.parse(res);
    }

    /**
     * get virtual cluster node resource.
     */
    public async getNodeResource(): Promise<{[id: string]: INodeResource}> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v2/virtual-clusters/nodeResource`);
        const res = await request.get(url);
        return JSON.parse(res);
    }

    /**
     * Create or update a new virtual cluster.
     * @param vcName The name of the new virtual cluster.
     * @param vcCapacity The new capacity.
     * @param vcMaxCapacity The new max capacity, range of [vcCapacity, 100].
     * @param token Specific an access token (optional).
     */
    public async createOrUpdate(
        vcName: string,
        vcCapacity: number,
        vcMaxCapacity: number,
        token?: string
    ): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/virtual-clusters/${vcName}`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await request.put(url, {
            body: JSON.stringify({vcCapacity, vcMaxCapacity}),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return JSON.parse(res);
    }

    /**
     * Delete a virtual cluster.
     * @param vcName The virtual cluster name.
     * @param token Specific an access token (optional).
     */
    public async delete(vcName: string, token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/virtual-clusters/${vcName}`);
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
     * Change a virtual cluster's status.
     * @param vcName The virtual cluster name.
     * @param vcStatus The new status 'running' | 'stopped'.
     * @param token Specific an access token (optional).
     */
    public async changeStatus(vcName: string, vcStatus: 'running' | 'stopped', token?: string): Promise<any> {
        const url = Util.fixUrl(`${this.cluster.rest_server_uri}/api/v1/virtual-clusters/${vcName}/status`);
        if(token === undefined) {
            token = await super.token();
        }
        const res = await request.put(url, {
            body: JSON.stringify({vcStatus}),
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return JSON.parse(res);
    }
}