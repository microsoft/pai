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
import { ComboBox, Icon } from "office-ui-fabric-react/lib/index";
import React, {useState, useEffect} from 'react';
import {FontClassNames} from '@uifabric/styling';
import { Stack, DetailsList, SelectionMode, DetailsRow, concatStyleSets, getTheme } from 'office-ui-fabric-react';
import { isEmpty, uniq } from 'lodash';
import PropTypes from 'prop-types';
const {palette} = getTheme();

const ContainerThreadTable = ({dumpData, onRenderDetailsHeader}) => {
	const [curProcessId, setCurProcessId] = useState({key: 'All', text: 'All'});
	const [filteredDumpData, setFilteredDumpData] = useState(dumpData);
	const [columns, setColumns] = useState([]);

	const ComboBoxCustomStyledExampleStyles = {
		container: {
			display: 'flex',
			width: 260,
		},
		label: {
			paddingTop: 8,
			width: 100,
		},
		root: {
		marginLeft: 5,
		},
	};

	function applySortProps(column) {
		column.className = FontClassNames.medium;
		column.headerClassName = [FontClassNames.medium,
			{
				padding: '6px 0',
				height: '44px',
				lineHeight: 44,
			}];
		column.isResizable = true;
		column.sorted = false;
		return column;
	}
	
	const threadIdColumn = applySortProps({
		key: 'threadId',
		minWidth: 60,
		maxWidth: 90,
		name: 'Thread ID',
		fieldName: 'threadId',
	});

	const processIdColumn = applySortProps({
		key: 'processId',
		minWidth: 60,
		maxWidth: 90,
		name: 'Process ID',
		fieldName: 'processId',
	});
	
	const threadNameColumn = applySortProps({
		key: 'threadName',
		minWidth: 280,
		maxWidth: 310,
		name: 'Thread Name',
		fieldName: 'threadName',
	});

	const threadStateColumn = applySortProps({
		key: 'threadState',
		minWidth: 120,
		maxWidth: 150,
		name: 'Thread State',
		fieldName: 'threadState',
	});

	const ThreadLocksColumn = applySortProps({
		key: 'ThreadLocks',
		minWidth: 300,
		name: 'Thread Locks',
		fieldName: 'blockedByLock',
	});

	const unFoldIconColumn = applySortProps({
		key: 'unFoldIcon',
		name: '',
		isIconOnly: true,
		minWidth: 16,
		maxWidth: 16,
		onRender: (item, index) => {
			if (!isEmpty(item.stackTrace.elems) || !isEmpty(item.processCmd)) {
				return <Icon iconName='ChevronRightSmall' className='thread-ChevronRightSmallIcon'></Icon>;
			}
			return '';
		},
	})
	
	const tableColumns = [
		threadIdColumn,
		processIdColumn,
		threadNameColumn,
		threadStateColumn,
		ThreadLocksColumn,
		unFoldIconColumn,
	];

	useEffect(() => {
		setColumns(tableColumns);
	}, []);

	function getProcessIdOption() {
		let processIdList = ['All'];
		let processOptionList = [];
		dumpData.map((item, index) => {
			processIdList.push(item.processId);
		});
		const processList = uniq(processIdList);
		processList.map((item, index) => {
			processOptionList.push({key: item, text: item});
		})
		return processOptionList;
	}

	function filterProcessIdItem(e, processId) {
		if (curProcessId.key === processId.key) {
			return;
		}
		const tableRowDetails = document.querySelectorAll('.thread-tableRowSummary');
		tableRowDetails.forEach((item) => {
			item.style.display = 'none';
			item.previousSibling.firstChild.lastChild.style.transform = null;
		})

		setCurProcessId(processId);
		if (processId.key === 'All') {
			setFilteredDumpData(dumpData);
			return;
		}
		const filterData = dumpData.filter((item, index) => {
			return item.processId === processId.key;
		})
		setFilteredDumpData(filterData);
	}

	function onRenderRow(props) {
		const customStyles = {};
		let customTableRowDetailStyles = {};
		const itemIndex = props.itemIndex;
		const renderData = filteredDumpData;
		
		function onToggleLocksDetail(e, index) {
			e.stopPropagation();
			e.persist();
			const targetAttributeClassName = e.target.getAttribute('class');
			let tableRowDetails = null;
			let tableRowUnFoldIcon = null;
			if (targetAttributeClassName.indexOf('thread-ChevronRightSmallIcon') > -1) {
				tableRowDetails = e.target.parentNode.parentNode.parentNode.nextSibling;
				tableRowUnFoldIcon = e.target.parentNode.parentNode.lastChild;
			} else {
				tableRowDetails = e.target.parentNode.parentNode.nextSibling;
				tableRowUnFoldIcon = e.target.parentNode.lastChild;
			}
			if (isEmpty(tableRowDetails)) {
				return;
			}
			
			const display = tableRowDetails.style.display;
			if (display === 'none') {
				tableRowDetails.style.display = 'block';
				tableRowUnFoldIcon.style.transform = 'rotateZ(90deg)';
			} else if(display === 'block') {
				tableRowDetails.style.display = 'none';
				tableRowUnFoldIcon.style.transform = null;
			}
		}

		if (props) {
			if (props.itemIndex % 2 !== 0) {
				customStyles.root = {backgroundColor: '#FAFAFA'};
				customTableRowDetailStyles = {backgroundColor: '#FAFAFA'};
			}

			return (
				<div style={{borderBottom: '1px solid #F3F2F1'}}>
					<DetailsRow {...props} styles={customStyles} onClick={(e) => onToggleLocksDetail(e, itemIndex)} />
					{ (!isEmpty(renderData[itemIndex].stackTrace.elems) || !isEmpty(renderData[itemIndex].processCmd)) && (
						<div
							style={concatStyleSets(customTableRowDetailStyles, {display: 'none', color: palette.neutralSecondary})}
							className={c(t.pa3, FontClassNames.medium, 'thread-tableRowSummary')}
						>
							{!isEmpty(renderData[itemIndex].processCmd) && (
								<div className={c(t.flex, t.pb3)}>
									<div style={{minWidth: 110}}>Command Line :&nbsp;</div>
									<div className={c(t.flexGrow1)}>{renderData[itemIndex].processCmd.replace(/[\"]/g, '')}</div>
								</div>
							)}
							{renderData[itemIndex].stackTrace.elems && (
								<div className={c(t.flex)}>
									<div style={{minWidth: 110}}>Stack Trace :&nbsp;</div>
									<div className={c(t.flexGrow1)}>
										{renderData[itemIndex].stackTrace.elems.map((elemItem, index) => {
											return <div key={index}>{elemItem}</div>
										})}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			);
		}
		return null;
	}
	
	return (
		<Stack className={c(t.ph2)} styles={{height: '100%'}}>
			<Stack styles={{root: {paddingTop: 50, position: 'sticky', top: 0, zIndex: 10}}}>
				<Stack styles={{root: {backgroundColor: palette.neutralLighterAlt}}}>
				<ComboBox
					label='Process ID: '
					options={getProcessIdOption()}
					selectedKey={curProcessId.key}
					styles={ComboBoxCustomStyledExampleStyles}
					onItemClick={filterProcessIdItem}
					className={c(t.pa3)}
				/>
			</Stack>
			</Stack>
			<DetailsList
				columns={columns}
				setKey="key"
				items={filteredDumpData}
				selectionMode={SelectionMode.none}
				onRenderRow={onRenderRow}
				onRenderDetailsHeader={onRenderDetailsHeader}
				styles={{
					root: {minWidth: 420, position: 'relative', overflow: 'visible'},
					headerWrapper: {position: 'sticky', height: 44, top: 114, zIndex: 10, paddingTop: 0},
				}}
			/>
		</Stack>
	);
}

ContainerThreadTable.prototype = {
	dumpData: PropTypes.array.isRequired,
	onRenderDetailsHeader: PropTypes.func.isRequired,
}

export default ContainerThreadTable;
