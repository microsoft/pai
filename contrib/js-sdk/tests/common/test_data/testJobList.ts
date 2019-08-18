/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IJobStatusV1 } from '../../../src/models/job';

export const testJobList: IJobStatusV1[] = [{
    "appExitCode": 0,
    "completedTime": 1563499887777,
    "createdTime": 1563499625106,
    "executionType": "STOP",
    "name": "sklearn-mnist",
    "retries": 0,
    "retryDetails": {
        "platform": 0,
        "resource": 0,
        "user": 0
    },
    "state": "SUCCEEDED",
    "subState": "FRAMEWORK_COMPLETED",
    "totalGpuNumber": 0,
    "totalTaskNumber": 1,
    "totalTaskRoleNumber": 1,
    "username": "test",
    "virtualCluster": "default"
}];