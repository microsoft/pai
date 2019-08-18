/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License in the project root for license information.
 * @author Microsoft
 */

import { IJobStatus } from '../../../src/models/job';

export const testJobStatus: IJobStatus = {
	"name": "tensorflow_serving_mnist_2019_6585ba19",
	"jobStatus": {
		"username": "core",
		"state": "RUNNING",
		"subState": "APPLICATION_RUNNING",
		"executionType": "START",
		"retries": 1,
		"retryDetails": {
			"user": 0,
			"platform": 1,
			"resource": 0
		},
		"createdTime": 1565329763372,
		"completedTime": null,
		"appId": "application_1565337391589_0002",
		"appProgress": 0,
		"appTrackingUrl": "http://10.151.40.234/yarn/10.151.40.234:8088/proxy/application_1565337391589_0002/",
		"appLaunchedTime": 1565337476313,
		"appCompletedTime": null,
		"appExitCode": null,
		"appExitSpec": null,
		"appExitDiagnostics": null,
		"appExitMessages": {
			"container": null,
			"runtime": null,
			"launcher": null
		},
		"appExitTriggerMessage": null,
		"appExitTriggerTaskRoleName": null,
		"appExitTriggerTaskIndex": null,
		"appExitType": null,
		"virtualCluster": "default"
	},
	"taskRoles": {
		"worker": {
			"taskRoleStatus": {
				"name": "worker"
			},
			"taskStatuses": [
				{
					"taskIndex": 0,
					"taskState": "RUNNING",
					"containerId": "container_e34_1565337391589_0002_01_000002",
					"containerIp": "10.151.40.238",
					"containerPorts": {
						"ssh": "34235",
						"http": "34236",
						"model_server": "34237"
					},
					"containerGpus": 8,
					"containerLog": "http://10.151.40.234/yarn/10.151.40.238:8042/node/containerlogs/container_e34_1565337391589_0002_01_000002/core/",
					"containerExitCode": null
				}
			]
		}
	}
};