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

/**
 * OpenPAI Virtual Cluster.
 */
export interface IVirtualCluster {
    /** capacity percentage this virtual cluster can use of entire cluster */
    capacity: number;

    /** max capacity percentage this virtual cluster can use of entire cluster */
    maxCapacity: number;

    /** used capacity percentage this virtual cluster can use of entire cluster */
    usedCapacity: number;
    numActiveJobs: number;
    numJobs: number;
    numPendingJobs: number;
    resourcesUsed: {
        memory: number;
        vCores: number;
        GPUs: number;
    };
    resourcesTotal: {
        memory: number;
        vCores: number;
        GPUs: number;
    };
    dedicated: boolean;

    /** available node list for this virtual cluster */
    nodeList: string[];

    /**
     * RUNNING: vc is enabled.
     * STOPPED: vc is disabled, without either new job or running job.
     * DRAINING: intermedia state from RUNNING to STOPPED, in waiting on existing job.
     */
    status: 'RUNNING' | 'STOPPED' | 'DRAINING';
}

/**
 * OpenPAI Virtual Cluster Node Resource.
 */
export interface INodeResource {
    gpuTotal: number;
    gpuUsed: number;
    gpuAvaiable: number;
}