/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IVirtualCluster } from '../../../src/models/virtualCluster';

export const testVirtualClusters: IVirtualCluster = {
    "capacity": 26.481485,
    "maxCapacity": 100,
    "usedCapacity": 5.555556,
    "numActiveJobs": 3,
    "numJobs": 3,
    "numPendingJobs": 0,
    "resourcesUsed": {
        "memory": 27648,
        "vCores": 15,
        "GPUs": 3
    },
    "status": "RUNNING",
    "dedicated": false,
    "resourcesTotal": {
        "vCores": 85.8000114,
        "memory": 740295.209472,
        "GPUs": 14.3000019
    },
    "nodeList": [
        "10.151.40.235",
        "10.151.40.226",
        "10.151.40.239",
        "10.151.40.242",
        "10.151.40.227",
        "10.151.40.236",
        "10.151.40.228",
        "10.151.40.233",
        "10.151.40.224",
        "10.151.40.229",
        "10.151.40.237",
        "10.151.40.241",
        "10.151.40.232",
        "10.151.40.238",
        "10.151.40.240"
    ]
}