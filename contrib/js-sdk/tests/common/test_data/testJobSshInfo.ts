/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IJobSshInfo } from '../../../src/models/job';

export const testJobSshInfo: IJobSshInfo = {
    "containers": [
        {
            "id": "container_e34_1565337391589_0002_01_000002",
            "sshIp": "10.151.40.238",
            "sshPort": "34235"
        }
    ],
    "keyPair": {
        "folderPath": "hdfs://10.151.40.234:9000/Container/core/core~tensorflow_serving_mnist_2019_6585ba19/ssh/keyFiles",
        "publicKeyFileName": "core~tensorflow_serving_mnist_2019_6585ba19.pub",
        "privateKeyFileName": "core~tensorflow_serving_mnist_2019_6585ba19",
        "privateKeyDirectDownloadLink": "http://10.151.40.234/a/10.151.40.234:5070/webhdfs/v1/Container/core/core~tensorflow_serving_mnist_2019_6585ba19/ssh/keyFiles/core~tensorflow_serving_mnist_2019_6585ba19?op=OPEN"
    }
};