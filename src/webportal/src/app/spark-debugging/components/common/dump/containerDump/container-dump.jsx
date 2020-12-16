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
import React from 'react';
import { Stack, CommandBar, CommandBarButton, concatStyleSets, memoizeFunction, MessageBar, MessageBarType, Panel, PanelType, DetailsHeader, ColorClassNames} from 'office-ui-fabric-react';
import { isEmpty } from 'lodash';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import PropTypes from 'prop-types';
import ContainerProcessListTable from './process-list-table';
import ContainerThreadTable from './thread-table';
import dumpNameText from './dump-name-text';

const {PROCESS_DUMP_TEXT, THREAD_DUMP_TEXT} = dumpNameText;

const ContainerDump = ({isModalOpen, onCloseDumpView, dumpData, getDumpDataErrorMessage, containerId, jobType, containerTitle, containerIconName}) => {

	function getHeaderTitle() {
		return {
			key: 'dump',
			name: 'ContainerDump',
			text: containerTitle,
			buttonStyles: {root: { height: '100%'}},
			iconProps: {
				iconName: containerIconName,
			},
		};
	}

	function  getClose() {
		return {
			key: 'close',
			name: 'Close',
			buttonStyles: {root: { height: '100%', color: 'white'}},
			iconOnly: true,
			iconProps: {
				iconName: 'Cancel',
			},
			onClick() {
				onCloseDumpView();
			},
		};
	}

	const headerTitleItems = [getHeaderTitle()];
	const headerCloseFarItems = [getClose()];

	const CustomButton= props => {
		const itemStyles = {
		  label: { fontSize: 15 },
		};
		const getCommandBarButtonStyles = memoizeFunction(
		  (originalStyles) => {
			if (!originalStyles) {
			  return itemStyles;
			}
			return concatStyleSets(originalStyles, itemStyles);
		  },
		);
		return <CommandBarButton {...props} styles={getCommandBarButtonStyles(props.styles)} />;
	  };

	function onRenderDetailsHeader(props) {
		const customStyles = {};
		if (props) {
		  customStyles.root = {height: '100%', padding: 0};
		  return <DetailsHeader {...props} styles={customStyles} />;
		}
		return null;
	}

	return (
		<Panel
			isOpen={isModalOpen}
			onDismiss={onCloseDumpView}
			isLightDismiss
			type={PanelType.large}
			hasCloseButton={false}
			styles={{
				content: {padding: '0!important'},
				overlay: [ColorClassNames.blackTranslucent40Background],
		        content: [t.flex, t.flexAuto, t.flexColumn, {padding: '0!important'}],
          		scrollableContent: [t.flex, t.flexAuto],
			}}
		>
			<Stack styles={{root: {position: 'absolute', width: '100%', zIndex: 999}}} className={c(t.borderBox)}>
				<CommandBar
					items={headerTitleItems}
					farItems={headerCloseFarItems}
					styles={{root: {padding: 0, width: '100%', height: 50}}}
					buttonAs={CustomButton}
				/>
			</Stack>
			{isEmpty(dumpData) && isEmpty(getDumpDataErrorMessage) && (
				<Spinner
					size={SpinnerSize.large}
					ariaLive="assertive"
					className={c(t.absolute, t.absoluteFill)}
					styles={{root: {zIndex: 20}}}
				/>
			)}
			{isEmpty(dumpData) && !isEmpty(getDumpDataErrorMessage) && (
				<MessageBar
					messageBarType={MessageBarType.error}
					styles={{root: {marginTop: 50}}}
				>
					{`Failed to fetch ${containerTitle} data.`}
				</MessageBar>
			)}
			{!isEmpty(dumpData) && isEmpty(getDumpDataErrorMessage) && (containerTitle === PROCESS_DUMP_TEXT) && (
				<ContainerProcessListTable
					dumpData={dumpData}
					containerId={containerId}
					onRenderDetailsHeader={onRenderDetailsHeader}
					jobType={jobType}
				/>
			)}
			{!isEmpty(dumpData) && isEmpty(getDumpDataErrorMessage) && (containerTitle === THREAD_DUMP_TEXT) && (
				<ContainerThreadTable
					dumpData={dumpData}
					onRenderDetailsHeader={onRenderDetailsHeader}
				/>
			)}
		</Panel>
	);
}

ContainerDump.prototype = {
	isModalOpen: PropTypes.bool.isRequired,
	onCloseDumpView: PropTypes.func.isRequired,
	dumpData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
	containerTitle: PropTypes.string.isRequired,
	containerIconName: PropTypes.string.isRequired,
	getDumpDataErrorMessage: PropTypes.string.isRequired,
	containerId: PropTypes.string,
	jobType: PropTypes.string,
}

export default ContainerDump;
