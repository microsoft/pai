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
import c from 'classnames';
import t from 'tachyons-sass/tachyons.scss';
import React, {useState} from 'react';
import {FontClassNames, ColorClassNames} from '@uifabric/styling';
import { Stack, DetailsList, SelectionMode, DetailsRow, concatStyleSets, getTheme} from 'office-ui-fabric-react';
import { isEmpty, drop, dropRight, remove, trim } from 'lodash';
import {addCommas} from './conn';
import PropTypes from 'prop-types';
const {palette} = getTheme();

const ContainerProcessListTable = ({dumpData, onRenderDetailsHeader, containerId, jobType}) => {

	function getDetailsListTable() {

		function applySortProps(column) {
			column.className = FontClassNames.medium;
			column.headerClassName = [FontClassNames.medium,
				{
					padding: '6px 0',
					height: '44px',
					lineHeight: 44,
				}];
			column.isResizable = true;
			return column;
		}
		
		const containerIdColumn = applySortProps({
			key: 'ContainerId',
			minWidth: 350,
			maxWidth: 400,
			name: 'Container ID',
			fieldName: 'ContainerId',
		});
		
		const totalMemoryNeededColumn = applySortProps({
			key: 'totalMemoryNeeded',
			minWidth: 140,
			maxWidth: 170,
			name: 'Total Memory Needed',
			fieldName: 'TotalMemoryNeeded',
		});
	
		const VirtualMemoryUtilizationColumn = applySortProps({
			key: 'virtualMemoryUtilization',
			minWidth: 180,
			maxWidth: 210,
			name: 'Virtual Memory Utilization',
			fieldName: 'VirtualMemoryUtilization',
			onRender: (item) => {
				return (
					<div>
						{item['VirtualMemoryUtilization'] + ' (' + (item['VirtualMemoryUtilization'] * 100 / item['TotalMemoryNeeded']).toFixed(2)  + '%)'}
					</div>
				);
			}
		})

		const PhysicalMemoryUtilizationColumn = applySortProps({
			key: 'PhysicalMemoryUtilization',
			minWidth: 180,
			maxWidth: 210,
			name: 'Physical Memory Utilization',
			fieldName: 'PhysicalMemoryUtilization',
			onRender: (item) => {
				return (
					<div>
						{item['PhysicalMemoryUtilization'] + ' (' + (item['PhysicalMemoryUtilization'] * 100 / item['TotalMemoryNeeded']).toFixed(2)  + '%)'}
					</div>
				);
			}
		});

		const totalVCoresNeededColumn =  applySortProps({
			key: 'totalVCoresNeeded',
			minWidth: 140,
			maxWidth: 170,
			name: 'Total VCores Needed',
			fieldName: 'TotalVCoresNeeded',
		});

		const vCoresColumn = applySortProps({
			key: 'vCores',
			minWidth: 150,
			maxWidth: 180,
			name: 'CPU VCores Utilization',
			fieldName: 'CpuVCoresUtilization',
		});
	
		const columns = [
			containerIdColumn,
			totalMemoryNeededColumn,
			VirtualMemoryUtilizationColumn,
			PhysicalMemoryUtilizationColumn,
			totalVCoresNeededColumn,
			vCoresColumn,
		];
	
		function dealProcessTreeDumpInfo(ProcessTreeDumpInfo) {
			const dumpInfoColumnCount = ProcessTreeDumpInfo.indexOf('COMMAND_LINE') > -1 ? 5 : 4;
			const treeDumpTableArr = [];
			const treeDumpList = ProcessTreeDumpInfo.replace(/[\r\n]/g, "").split('\|');
			const newTreeDumpList = ProcessTreeDumpInfo.indexOf('COMMAND_LINE') > -1 ? treeDumpList : dropRight(treeDumpList);
			remove(newTreeDumpList, (item) => isEmpty(trim(item)));

			newTreeDumpList.map((item, index) => {
				const rowItem = drop(item.split(' '));
				const commandLineStr = rowItem.slice(dumpInfoColumnCount - 1, rowItem.length).join(' ').replace(/[\"]/g, '');
				treeDumpTableArr.push(rowItem.slice(0, dumpInfoColumnCount - 1).concat(commandLineStr));
			});

			function formatCellItemData(cellIndex, stringNumber) {
				switch (cellIndex) {
					case 1:
						return addCommas(trim(stringNumber));
					case 2:
					case 3:
						return addCommas(trim((stringNumber / 1048576).toFixed(2)));
					default:
						return stringNumber;
				}
			}
			
			return (
				treeDumpTableArr.map((rowItem, rowIndex) => {
					return (
						<div key={rowIndex} className={c(t.flex, t.pv2, t.flexNowrap)}>
							{rowItem.map((cellItem, cellIndex) => {
								return (
									<div
										key={cellIndex}
										style={{
											width: cellIndex === 0 ? 50 : 200,
											textAlign: cellIndex === 4 ? 'left' : 'right',
											marginLeft: cellIndex === 4 ? 20 : 10,
											 wordBreak: 'break-all',
											 flexGrow: cellIndex === 4 ? 1 : '',
										}}
									>
										{rowIndex === 0 && trim(cellItem.replace('BYTES', 'MB').replace('MILLIS', 'MS'))}
										{rowIndex !== 0 && formatCellItemData(cellIndex, cellItem)}
									</div>
								)
							})}
						</div>
					)
				})
			);
		}
	
		function onRenderRow(props) {
			const customStyles = {};
			let customLocksDetailStyles = {};
			const itemIndex = props.itemIndex;
			if (props) {
				if (props.itemIndex % 2 !== 0) {
					customStyles.root = {backgroundColor: '#FAFAFA'};
					customLocksDetailStyles = {backgroundColor: '#FAFAFA'};
				}
				
				return (
					<div style={{borderBottom: '1px solid #F3F2F1'}}>
						<DetailsRow {...props} styles={customStyles} />
						{!isEmpty(dumpData[itemIndex].ProcessTreeDump) && (
							<div
								style={concatStyleSets(customLocksDetailStyles, {display: 'block', color: palette.neutralSecondary, whiteSpace: 'pre-wrap'})}
								className={c(t.pa3, FontClassNames.medium)}
							>
								<div>Process Tree Dump Information :</div>
								{dealProcessTreeDumpInfo(dumpData[itemIndex].ProcessTreeDump)}
							</div>
						)}
					</div>
				  );
			}
			return null;
		}

		return (
			<DetailsList
				columns={columns}
				setKey="key"
				items={dumpData}
				selectionMode={SelectionMode.none}
				onRenderRow={onRenderRow}
				onRenderDetailsHeader={onRenderDetailsHeader}
				styles={{
					root: {minWidth: 420, position: 'relative', overflow: 'visible'},
					headerWrapper: {position: 'sticky', height: 44, top: 50, zIndex: 10, paddingTop: 0},
				}}
			/>
		)
	}

	return (
		<Stack className={c(t.ph2)} styles={{root: {paddingTop: 50}}}>
			{getDetailsListTable()}
		</Stack>
	);
}

ContainerProcessListTable.prototype = {
	dumpData: PropTypes.array.isRequired,
	DetailsHeader: PropTypes.func.isRequired,
	containerId: PropTypes.string.isRequired,
}

export default ContainerProcessListTable;