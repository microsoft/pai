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
"use strict";
import qs from 'querystring';
import {restServerClient} from '../../../../../common/http-client';

export async function getProcessListDumpLogByJobName(jobName, taskIndex, taskRoleName) {
	const params = qs.stringify({taskIndex, taskRoleName, isAllContainers: false});
	const processListDumpUrl =`/api/v2/mp/jobs/jobName/${jobName}/pTreeDumpContainer?${params}`;
	const res = await restServerClient.get(processListDumpUrl);
	return res.data;
}

export async function getProcessListDumpLogByAppId(appId, executorId, attemptId) {
	const params = qs.stringify({executorId, isAllContainers: false});
	const processListDumpUrl = `/api/v2/mp/jobs/appId/${appId}/pTreeDumpContainer?${params}`;
	const res = await restServerClient.get(processListDumpUrl);
	return res.data;
}

export async function getThreadDumpLogByJobName(jobName, taskIndex, taskRoleName) {
	const params = qs.stringify({taskIndex, taskRoleName});
	const threadDumpUrl = `/api/v2/mp/jobs/jobName/${jobName}/threadDumpContainer?${params}`;
	const res = await restServerClient.get(threadDumpUrl);
	return res.data;
}

export async function getThreadDumpLogByAppId(appId, executorId, attemptId) {
	const params = qs.stringify({executorId});
	const threadDumpUrl = `/api/v2/mp/jobs/appId/${appId}/threadDumpContainer?${params}`;
	const res = await restServerClient.get(threadDumpUrl);
	return res.data;
}

export async function getHeapDumpLogByJobName(jobName, taskIndex, taskRoleName) {
	const params = qs.stringify({taskIndex, taskRoleName});
	const heapDumpUrl = `/api/v2/mp/jobs/jobName/${jobName}/heapDumpContainer?${params}`;
	const res = await restServerClient.get(heapDumpUrl);
	return res.data;
}

export async function getHeapDumpLogByAppId(appId, executorId, attemptId) {
	const params = qs.stringify({executorId});
	const heapDumpUrl = `/api/v2/mp/jobs/appId/${appId}/heapDumpContainer?${params}`;
	const res = await restServerClient.get(heapDumpUrl);
	return res.data;
}

export function getLocalCreateStampByFileName(heapDumpFileName) {
	const machineNameArr = heapDumpFileName.split(/[_.]/);
	const machineTimestamp = Date.parse(`${machineNameArr[1]}/${machineNameArr[2]}/${machineNameArr[3]} ${machineNameArr[4]}:${machineNameArr[5]}:${machineNameArr[6]}`);
	
	const createDate = new Date();
	const timeZone = createDate.getTimezoneOffset() - 420;
	const userLocalTimestamp = machineTimestamp - timeZone * 60 * 1000;
	return userLocalTimestamp;
}

export async function getLogsFileNameList(jobType, jobName, appId, taskIndex, taskRoleName, executorId, jobStatus, attemptId, containerLogUrl) {
	let LogUri = '';
	if (jobType === 'launcherAM') {
		LogUri = `/api/v2/mp/jobs/appId/${appId}/dumpContainerLogs?logType=launcherAM&logFile=all`;
	}
	if (jobType === 'LAUNCHER') {
		LogUri = `/api/v2/mp/jobs/jobName/${jobName}/dumpContainerLogs?taskIndex=${taskIndex}&taskRoleName=${taskRoleName}&logFile=all`;
		if (containerLogUrl) {
			LogUri = LogUri + `&containerLogUrl=${containerLogUrl}`;
		}
	}
	if (jobType === 'SPARK') {
		LogUri = `/api/v2/mp/jobs/appId/${appId}/dumpContainerLogs?executorId=${executorId}&jobStatus=${jobStatus}&attemptId=${attemptId}&logFile=all`;
	}

	let queryParam = `&start=-1024`;
	let logDownloadUri = LogUri + queryParam;

	let res = {};
	try {
		res = await restServerClient.get(logDownloadUri);
		if (res.data[0] === undefined) {
			return;
		}
		return res.data;
	} catch(err) {
		if (err.response) {
			return err.response.data.message;
		}
	}
}

export function addCommas(fileLength) {
	let result = [];
	let counter = 0;
	const integerAndDecimal = (fileLength || 0).toString().split('.');
	const integerPart = integerAndDecimal[0];
	const decimalPart = integerAndDecimal[1];
	fileLength = (fileLength || 0).toString().split('');
	for (let i = integerPart.length - 1; i >= 0; i--) {
		counter ++;
		result.unshift(integerPart[i]);
		if (!(counter % 3) && i != 0) {
			result.unshift(', ');
		}
	}
	return decimalPart ? (result.join('') + '.' + decimalPart) : result.join('');
}