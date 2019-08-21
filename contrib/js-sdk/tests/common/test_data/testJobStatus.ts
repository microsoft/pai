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
		"appTrackingUrl": "http://0.0.0.34/yarn/0.0.0.34:8088/proxy/application_1565337391589_0002/",
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
					"containerIp": "0.0.0.38",
					"containerPorts": {
						"ssh": "34235",
						"http": "34236",
						"model_server": "34237"
					},
					"containerGpus": 8,
					"containerLog": "http://0.0.0.34/yarn/0.0.0.38:8042/node/containerlogs/container_e34_1565337391589_0002_01_000002/core/",
					"containerExitCode": null
				}
			]
		}
	}
};