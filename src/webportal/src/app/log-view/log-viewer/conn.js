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
import {isEmpty, trimStart, trimEnd, lowerCase, upperFirst} from 'lodash';
import {restServerClient} from '../../common/http-client';

const params = new URLSearchParams(window.location.search);
const jobName = params.get('jobName');
const appId = params.get('appId');
const jobStatus = params.get('jobStatus');
const taskIndex = params.get('taskIndex');
const executorId = params.get('executorId');
const taskRoleName = params.get('taskRoleName');
const attemptId = params.get('attemptId');
const containerLogUrl = params.get('containerLogUrl');
const jobType = params.get('jobType');

export async function fetchContainerLog(start, end, isSaveToFile, logFileName) {
	const commonLogUri = getLogDownloadUri(logFileName);
	let queryParam = start === undefined ? "" : `&start=${start}`;
	queryParam = queryParam + (end === undefined ? "" : `&end=${end}`);
	let logDownloadUri = commonLogUri + queryParam;

	let res = {};
	try {
		res = await restServerClient.get(logDownloadUri);
		if (res.data[0] === undefined) {
			alert('fetch data failed!');
			return;
		}
		if (isSaveToFile === true) {
			const logContent = res.data[0].content;
			const logTextResult = getReplacedEscapeString(logContent);
			const text = new Blob([logTextResult], { type: 'text/plain' });
			const url = window.URL.createObjectURL(text);
			const element = document.createElement('a');
			element.style.display = 'none';
			element.href = url;
			// download the log to local file
			element.download = getLocalFileName(logFileName);
			document.body.appendChild(element);
			element.click();
			window.URL.revokeObjectURL(url);
		}
		return res.data;
	} catch(err) {
		if (err.response) {
			return err.response.data.message;
		}
	}
}

export async function downloadContainerLogToFile(logFileName) {
	let heapDownloadUrl = '';
	if (appId) {
		const params = qs.stringify({executorId, attemptId, jobType: upperFirst(lowerCase(jobType)), logFile: logFileName });
		heapDownloadUrl = `/api/v2/mp/jobs/appId/${appId}/containerDumpFileUrl?${params}`;
	}
	if (jobName) {
		const params = qs.stringify({taskRoleName, taskIndex, jobType: upperFirst(lowerCase(jobType)), logFile: logFileName });
		heapDownloadUrl = `/api/v2/mp/jobs/jobName/${jobName}/containerDumpFileUrl?${params}`;
	}
	const res = await restServerClient.get(heapDownloadUrl);
	return res.data;
}

function getLocalFileName(logFileName) {
	if (jobType === 'launcherAM') {
		return `LAUNCHERAM_${logFileName}.txt`;
	}
	if (jobType === 'LAUNCHER') {
		if (taskRoleName === undefined) {
			return `LAUNCHER_${logFileName}_TaskIndex_${taskIndex}.txt`;
		}
		return `LAUNCHER_${logFileName}_${taskRoleName}_TaskIndex_${taskIndex}.txt`;
	}
	if (jobType === 'SPARK') {
		return `SPARK_${logFileName}_ExecutorId_${executorId}.txt`;
	}
}

function getLogDownloadUri(logFileName) {
	if (jobType === 'launcherAM') {
		let	launcherAMLogUri = `/api/v2/mp/jobs/appId/${appId}/dumpContainerLogs?logType=launcherAM&logFile=${logFileName}`;
		return launcherAMLogUri;
	}
	if (jobType === 'LAUNCHER') {
		let launcherLogUri = `/api/v2/mp/jobs/jobName/${jobName}/dumpContainerLogs?taskIndex=${taskIndex}&taskRoleName=${taskRoleName}&logFile=${logFileName}`;
		if (containerLogUrl) {
			launcherLogUri = launcherLogUri + `&containerLogUrl=${containerLogUrl}`;
		}
		return launcherLogUri;
	}
	if (jobType === 'SPARK') {
		let sparkLogUri = `/api/v2/mp/jobs/appId/${appId}/dumpContainerLogs?executorId=${executorId}&jobStatus=${jobStatus}&attemptId=${attemptId}&logFile=${logFileName}`;
		return sparkLogUri;
	}
}

export function getReplacedEscapeString(targetStr) {
	const replaceResult = targetStr.replace(/&quot;|&amp;|&lt;|&gt;|&nbsp;/g, function(matchStr) {
		const logTextMap = {
			'&quot;': '"',
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&nbsp;': ' ',
		};
		return logTextMap[matchStr];
	});
	return replaceResult;
}

export function getReplacedErrorMessageTagString(targetStr) {
	const matchedStr = targetStr.replace(/\r\n/g, '').match(/<h1>(.*?)<\/h1>/g);
	let removedStartTagStr = '';
	let removedEndTagStr = '';
	if (!isEmpty(matchedStr)) {
		removedStartTagStr = trimStart(matchedStr[0], '<h1>');
		removedEndTagStr = trimEnd(removedStartTagStr, '</h1>');
		return removedEndTagStr;
	}
	return targetStr;
}

export function addCommas(fileLength) {
    let result = [];
    let counter = 0;
    fileLength = (fileLength || 0).toString().split('');
    for (let i = fileLength.length - 1; i >= 0; i--) {
      counter ++;
      result.unshift(fileLength[i]);
      if (!(counter % 3) && i != 0) {
      result.unshift(', ');
      }
    }
    return result.join('');
  }