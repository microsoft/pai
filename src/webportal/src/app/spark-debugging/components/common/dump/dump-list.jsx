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

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

import ReactDOM from 'react-dom';
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
import React, {useState, useEffect} from 'react';
import {
	Stack,
	PrimaryButton,
	DefaultButton,
	Link,
	CommandBarButton,
	concatStyleSets,
	Dialog,
	DialogType,
	DialogFooter,
	getTheme,
} from 'office-ui-fabric-react';
import { isEmpty,startsWith, endsWith } from 'lodash';
import {
	getProcessListDumpLogByJobName,
	getProcessListDumpLogByAppId,
	getThreadDumpLogByJobName,
	getThreadDumpLogByAppId,
	getHeapDumpLogByJobName,
	getHeapDumpLogByAppId,
	getLocalCreateStampByFileName,
	getLogsFileNameList,
} from './containerDump/conn';
import ContainerDump from './containerDump/container-dump';
import PropTypes from 'prop-types';
import {statusColor} from '../../../../components/theme';

import './dump-list.css';
import dumpNameText from './containerDump/dump-name-text';

const {PROCESS_DUMP_TEXT, THREAD_DUMP_TEXT, SESSION_STORAGE_KEY} = dumpNameText;
const clickedHeapDump = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));
const {palette} = getTheme();

const DumpList = ({executorStatus, jobStatus, dumpStatus, jobType, jobName, executorId, appId, containerId, taskIndex, taskRoleName, attemptId, containerLogUrl, logsLinkHref}) => {
	const containerOrExecutorId = containerId ? containerId : executorId;
	const sessionStorageFlag = appId;
	const dumpStatusObj = [
		{status: 'unDump', dumpColor: palette.themeDarkAlt},
		{status: 'isDumping', dumpColor: palette.themeDarkAlt},
		{status: 'dumped', dumpColor: statusColor.succeeded},
	];

	const [isShowProcessListDumpView, setIsShowProcessListDumpView] = useState(false);
	const [isShowThreadDumpView, setIsShowThreadDumpView] = useState(false);
	const [isShowHeapConfirmDialog, setIsShowHeapConfirmDialog] = useState(false);
	const [containerProcessListDumpData, setContainerProcessListDumpData] = useState([]);
	const [containerThreadDumpData, setContainerThreadDumpData] = useState([]);
	const [dumpStatusInfo, setDumpStatusInfo] = useState(dumpStatusObj[0]);
	const [getDumpDataErrorMessage, setGetDumpDataErrorMessage] = useState(null);

	useEffect(() => {
		judgeJobsHeapDumpStatus(false);
	}, []);

	
	// save the ContainerId in the session storage, Remember the stamp when user clicked heap dump button, Ensure that can get the heap dump status when switch pages.
	function setSessionStorage() {
		let content = {};
		const createDate = new Date();  
		const clickTimestamp = createDate.getTime();
		const clickedHeapDump = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));
		if (isEmpty(clickedHeapDump)) {
			content[sessionStorageFlag] = {
				[containerOrExecutorId]: clickTimestamp,
			};
		} else {
			content = clickedHeapDump;
			if (!content[sessionStorageFlag]) {
				content[sessionStorageFlag] = {
					[containerOrExecutorId]: clickTimestamp,
				};
			}
			if (content[sessionStorageFlag]) {
				content[sessionStorageFlag][containerOrExecutorId] = clickTimestamp;
			}
		}
		sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(content));
	}

	// when enter the jobDetail page, use the container logs fileName to check the dump result.
	async function judgeJobsHeapDumpStatus(isDumped) {
		if (isEmpty(clickedHeapDump)) {
			setDumpStatusInfo(dumpStatusObj[0]);
			return;
		}
		if (!clickedHeapDump[sessionStorageFlag]) {
			setDumpStatusInfo(dumpStatusObj[0]);
			return;
		}
		if (!clickedHeapDump[sessionStorageFlag][containerOrExecutorId]) {
			setDumpStatusInfo(dumpStatusObj[0]);
			return;
		}
		if (isDumped) {
			return;
		}
		setDumpStatusInfo(dumpStatusObj[1]);
		
		const clickTimeStamp = clickedHeapDump[sessionStorageFlag][containerOrExecutorId];
		const logFileList = await getLogsFileNameList(jobType, jobName, appId, taskIndex, taskRoleName, executorId, jobStatus, attemptId, containerLogUrl);
		if (!isEmpty(logFileList)) {
			const stampArr = [0];
			logFileList.map((item, index) => {
				const fileName = item.fileName;
				if(startsWith(fileName, 'heapdump') && endsWith(fileName, '.zip')) {
					const fileNameStamp = getLocalCreateStampByFileName(fileName);
					stampArr.push(fileNameStamp);
				}
			})
			const lastDumpTime = stampArr.reduce((Stamp1, Stamp2) => {
				return Stamp1 > Stamp2 ? Stamp1 : Stamp2;
			});
			
			if (clickTimeStamp <= lastDumpTime) {
				setDumpStatusInfo(dumpStatusObj[2]);
				isDumped = true;
				return;
			} else {
				setDumpStatusInfo(dumpStatusObj[1]);
				setTimeout(() => {
					judgeJobsHeapDumpStatus(isDumped);
				}, 3000);
				return;
			}
		}
		setDumpStatusInfo(dumpStatusObj[0]);
		return;
	}

	// get process list dump
	async function onProcessListDumpClick() {
		setIsShowProcessListDumpView(true);
		if (isEmpty(containerProcessListDumpData)) {
			try {
				if (jobName) {
					await getProcessListDumpLogByJobName(jobName, taskIndex, taskRoleName).then(setContainerProcessListDumpData);
				} else {
					await getProcessListDumpLogByAppId(appId, executorId, attemptId).then(setContainerProcessListDumpData);
				}
			} catch (err) {
				setGetDumpDataErrorMessage(err.message);
			}
		}
	}

	// get thread dump
	async function onThreadDumpClick() {
		setIsShowThreadDumpView(true);
		if (isEmpty(containerThreadDumpData)) {
			try {
				if (jobName) {
					await getThreadDumpLogByJobName(jobName, taskIndex, taskRoleName).then(setContainerThreadDumpData);
				} else {
					await getThreadDumpLogByAppId(appId, executorId, attemptId).then(setContainerThreadDumpData);
				}
			} catch(err) {
				setGetDumpDataErrorMessage(err.message);
			}
		}
	}

	// get heap dump
	async function onHeapDumpClick() {
		if (dumpStatusInfo.status !== 'unDump') {
			setIsShowHeapConfirmDialog(true);
			return;
		}
		if (dumpStatusInfo.status === 'unDump') {
			setDumpStatusInfo(dumpStatusObj[1]);
			setSessionStorage();
			let heapDumpResult = '';
			try {
				if (jobName) {
					heapDumpResult = await getHeapDumpLogByJobName(jobName, taskIndex, taskRoleName);
				} else {
					heapDumpResult = await getHeapDumpLogByAppId(appId, executorId, attemptId);
				}

				if (heapDumpResult === 'Container heapDump success') {
					setDumpStatusInfo(dumpStatusObj[2]);
				} else {
					setDumpStatusInfo(dumpStatusObj[0]);
				}
			} catch(err) {
				alert(err.message);
				setDumpStatusInfo(dumpStatusObj[0]);
			}
		}
	}

	async function onRestartHeapDump() {
		setIsShowHeapConfirmDialog(false);
		setDumpStatusInfo(dumpStatusObj[1]);
		setSessionStorage();
		let heapDumpResult = '';
		try {
			if (jobName) {
				heapDumpResult = await getHeapDumpLogByJobName(jobName, taskIndex, taskRoleName);
			} else {
				heapDumpResult = await getHeapDumpLogByAppId(appId, executorId, attemptId);
			}
			if (heapDumpResult === 'Container heapDump success') {
				setDumpStatusInfo(dumpStatusObj[2]);
			} else {
				setDumpStatusInfo(dumpStatusObj[0]);
				alert(JSON.parse(heapDumpResult).message);
			}
		} catch(err) {

		}
	}

	const dumpItemStyles = {
		root: {backgroundColor: 'transparent', padding: 0 },
		rootDisabled: {backgroundColor: 'transparent' },
		icon: {marginLeft: 0},
	};

	const dialogContentProps = {
		type: DialogType.normal,
		title: 'Confirm',
		closeButtonAriaLabel: 'Close',
	};

	const modalProps = {
		isBlocking: true,
		styles: {
			main: {maxWidth: 450 },
			root: {backgroundColor: 'rgba(0, 0, 0, 0.3)'},
		},
	};

	const heapDumpHoverTip = (dumpStatus) => {
		switch(dumpStatus) {
			case 'unDump':
				return 'no dump';
			case 'isDumping':
				return 'isDumping, please wait';
			case 'dumped':
				return 'heap dump complete';
			default :
				return 'no dump';
		}

	}

	// job status is Running, LAUNCHER job: container status is Running, SPARK job: executor status is Active. can dump.
	const dumpButtonAbleClick = () => {
		const ableClick = jobType === 'LAUNCHER' ? !(executorStatus === 'Running' && jobStatus === 'Running') : !(executorStatus === 'Active' && jobStatus === 'Running');
		return ableClick;
	};

	const ableHideHeapConfirmDialog = () => {
		const isShow = dumpStatusInfo.status !== 'unDump' && isShowHeapConfirmDialog;
		return !isShow;
	}

	function onCloseDumpView() {
		setIsShowProcessListDumpView(false);
		setIsShowThreadDumpView(false);
		setContainerProcessListDumpData([]);
		setContainerThreadDumpData([]);
		setGetDumpDataErrorMessage(null);
	}

	function hideHeapConfirmDialog() {
		setIsShowHeapConfirmDialog(false);
	}

	return (
		<Stack horizontal horizontalAlign='space-between'>
			<Stack>
				<CommandBarButton
					styles={dumpItemStyles}
					iconProps={{iconName: 'ProcessMetaTask'}}
					text={PROCESS_DUMP_TEXT}
					disabled={dumpButtonAbleClick()}
					onClick={onProcessListDumpClick}
				/>
				{isShowProcessListDumpView && (
					<ContainerDump
						isModalOpen={isShowProcessListDumpView}
						onCloseDumpView={onCloseDumpView}
						dumpData={jobType === 'SPARK' ? (!isEmpty(containerProcessListDumpData) ? containerProcessListDumpData.processTreeDump : []) : containerProcessListDumpData}
						getDumpDataErrorMessage={getDumpDataErrorMessage}
						containerTitle={PROCESS_DUMP_TEXT}
						containerIconName='ProcessMetaTask'
						containerId={jobType === 'SPARK' ? containerProcessListDumpData.containerId : containerId}
						jobType={jobType}
					/>
				)}
			</Stack>
			<Stack>
				<CommandBarButton
					styles={dumpItemStyles}
					iconProps={{ iconName: 'TextDocument' }}
					text={THREAD_DUMP_TEXT}
					disabled={dumpButtonAbleClick()}
					onClick={onThreadDumpClick}
				/>
				{isShowThreadDumpView && (
					<ContainerDump
						isModalOpen={isShowThreadDumpView}
						onCloseDumpView={onCloseDumpView}
						dumpData={containerThreadDumpData}
						getDumpDataErrorMessage={getDumpDataErrorMessage}
						containerTitle={THREAD_DUMP_TEXT}
						containerIconName='TextDocument'
					/>
				)}
			</Stack>
			<Stack horizontal horizontalAlign='space-between'>
				<CommandBarButton
					styles={concatStyleSets(dumpItemStyles, {icon: {color: dumpStatusInfo.dumpColor}})}
					className={dumpStatusInfo.status === 'isDumping' ? 'heapDumpStatusButton heapDumpButton' : 'heapDumpButton'}
					iconProps={{iconName: 'ProgressRingDots'}}
					text='Heap'
					disabled={dumpButtonAbleClick() && dumpStatusInfo.status !== 'isDumping'}
					onClick={onHeapDumpClick}
				/>
			</Stack>
			<Dialog
				hidden={ableHideHeapConfirmDialog()}
				onDismiss={hideHeapConfirmDialog}
				dialogContentProps={dialogContentProps}
				modalProps={modalProps}
			>
				{dumpStatusInfo.status === 'dumped' && (
					<div>
						<span>There is a history heap dump file available, you can view it in&nbsp;</span>
						<span>
							<Link
								href={logsLinkHref}
								onClick={(event) => {
									event.preventDefault();
									window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
								}}
							>Logs</Link>
						</span>
						<span>&nbsp;or dump a new one. </span>
					</div>
				)}
				{dumpStatusInfo.status === 'isDumping' && (
					<div>
						<span>The container heap dump is in progress, do you want to start a new dump? </span>
					</div>
				)}
				<DialogFooter>
					<PrimaryButton onClick={onRestartHeapDump} text={dumpStatusInfo.status === 'dumped' ? 'Dump again' : 'Re Dump'} />
					<DefaultButton onClick={hideHeapConfirmDialog} text='Close' />
				</DialogFooter>
			</Dialog>
		</Stack>
	)
}

DumpList.prototype = {
	executorStatus: PropTypes.string.isRequired,
	jobStatus: PropTypes.string.isRequired,
	jobName: PropTypes.string,
	containerId: PropTypes.string,
	jobType: PropTypes.string,
}

export default DumpList;
