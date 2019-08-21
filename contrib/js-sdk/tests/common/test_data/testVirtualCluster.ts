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
        "0.0.0.35",
        "0.0.0.26",
        "0.0.0.39",
        "0.0.0.42",
        "0.0.0.27",
        "0.0.0.36",
        "0.0.0.28",
        "0.0.0.33",
        "0.0.0.24",
        "0.0.0.29",
        "0.0.0.37",
        "0.0.0.41",
        "0.0.0.32",
        "0.0.0.38",
        "0.0.0.40"
    ]
}