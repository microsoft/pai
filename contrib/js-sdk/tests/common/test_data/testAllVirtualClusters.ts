/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IVirtualCluster } from '../../../src/models/virtualCluster';

export const testAllVirtualClusters: { [id: string]: IVirtualCluster } = {
    "default": {
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
    },
    "vc2": {
        "capacity": 22.962963,
        "maxCapacity": 22.962963,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": false,
        "resourcesTotal": {
            "vCores": 74.40000012,
            "memory": 641934.2232575999,
            "GPUs": 12.40000002
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
    },
    "vc1": {
        "capacity": 17.222221,
        "maxCapacity": 17.222221,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": false,
        "resourcesTotal": {
            "vCores": 55.79999604,
            "memory": 481450.63249920008,
            "GPUs": 9.299999340000002
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
    },
    "test11": {
        "capacity": 5.740741,
        "maxCapacity": 5.740741,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": false,
        "resourcesTotal": {
            "vCores": 18.60000084,
            "memory": 160483.5628032,
            "GPUs": 3.1000001399999999
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
    },
    "test_vc_1": {
        "capacity": 100,
        "maxCapacity": 100,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": true,
        "resourcesTotal": {
            "vCores": 48,
            "memory": 417792,
            "GPUs": 8
        },
        "nodeList": [
            "10.151.40.230",
            "10.151.40.231"
        ]
    },
    "nni": {
        "capacity": 11.481482,
        "maxCapacity": 11.481482,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": false,
        "resourcesTotal": {
            "vCores": 37.20000168,
            "memory": 320967.1256064,
            "GPUs": 6.200000279999999
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
    },
    "testvc": {
        "capacity": 5.3703694,
        "maxCapacity": 5.3703694,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": false,
        "resourcesTotal": {
            "vCores": 17.399996856,
            "memory": 150129.75065088,
            "GPUs": 2.8999994760000007
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
    },
    "newtest": {
        "capacity": 0,
        "maxCapacity": 0,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": false,
        "resourcesTotal": {
            "vCores": 0,
            "memory": 0,
            "GPUs": 0
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
    },
    "test_new": {
        "capacity": 0,
        "maxCapacity": 0,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": false,
        "resourcesTotal": {
            "vCores": 0,
            "memory": 0,
            "GPUs": 0
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
    },
    "wertwer": {
        "capacity": 10.740738,
        "maxCapacity": 10.740738,
        "usedCapacity": 0,
        "numActiveJobs": 0,
        "numJobs": 0,
        "numPendingJobs": 0,
        "resourcesUsed": {
            "memory": 0,
            "vCores": 0,
            "GPUs": 0
        },
        "status": "RUNNING",
        "dedicated": false,
        "resourcesTotal": {
            "vCores": 34.79999112,
            "memory": 300259.4789376,
            "GPUs": 5.79999852
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
};