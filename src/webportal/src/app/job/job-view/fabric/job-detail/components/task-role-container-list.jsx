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

import {ThemeProvider} from '@uifabric/foundation';
import {createTheme, ColorClassNames, FontClassNames, FontSizes} from '@uifabric/styling';
import c from 'classnames';
import {capitalize, isEmpty, isNil, flatten} from 'lodash';
import {CommandBarButton, PrimaryButton, TooltipHost, DirectionalHint, Icon, Link} from 'office-ui-fabric-react';
import {DetailsList, SelectionMode, DetailsRow, DetailsListLayoutMode} from 'office-ui-fabric-react/lib/DetailsList';
import {CommandBar} from 'office-ui-fabric-react/lib/CommandBar';
import {ChoiceGroup} from 'office-ui-fabric-react/lib/ChoiceGroup';
import {ContextualMenuItemType} from 'office-ui-fabric-react/lib/ContextualMenu';
import PropTypes from 'prop-types';
import React from 'react';
import localCss from './task-role-container-list.scss';
import t from '../../../../../components/tachyons.scss';

import Context from './context';
import Timer from './timer';
import {getContainerLog, onRestartTaskRoleContainer} from '../conn';
import {parseGpuAttr, getContainerDurationString} from '../util';
import MonacoPanel from '../../../../../components/monaco-panel';
import StatusBadge from '../../../../../components/status-badge';
import Ordering from '../../../../../spark-debugging/components/common/table/Ordering';
import Filter from '../../JobList/Filter';
import FilterButton from './FilterButton';
import FrameworkContainerErrors from '../errors';
import CommonDebugTable from '../../../../../spark-debugging/components/common/table/CommonDebugTable';
import TableProperty from '../../../../../spark-debugging/components/common/table/TableProperty';
import DumpList from '../../../../../spark-debugging/components/common/dump/dump-list';

const theme = createTheme({
  palette: {
    themePrimary: '#0078d4',
    themeLighterAlt: '#eff6fc',
    themeLighter: '#deecf9',
    themeLight: '#c7e0f4',
    themeTertiary: '#71afe5',
    themeSecondary: '#2b88d8',
    themeDarkAlt: '#106ebe',
    themeDark: '#005a9e',
    themeDarker: '#004578',
    neutralLighterAlt: '#f1f1f1',
    neutralLighter: '#ededed',
    neutralLight: '#e3e3e3',
    neutralQuaternaryAlt: '#d3d3d3',
    neutralQuaternary: '#cacaca',
    neutralTertiaryAlt: '#c2c2c2',
    neutralTertiary: '#c2c2c2',
    neutralSecondary: '#858585',
    neutralPrimaryAlt: '#4b4b4b',
    neutralPrimary: '#333333',
    neutralDark: '#272727',
    black: '#1d1d1d',
    white: '#f8f8f8',
  },
});

const interval = 10000;

const statuses = {
  Waiting: true,
  Succeeded: true,
  Running: true,
  Stopped: true,
  Failed: true,
};

const containerErrorCode = {
  '-170000': 'NotAvailable',
  '0': 'Succeeded',
  '-170001': 'Launcher_InternalTransientError',
  '-170002': 'Launcher_InternalNonTransientError',
  '-170003': 'Launcher_InternalUnKnownError',
  '-170010': 'Launcher_ReportUnretrievable',
  '-170020': 'Launcher_DiagnosticsUnretrievable',
  '-170030': 'Launcher_DiagnosticsParseError',
  '-170040': 'Launcher_ExitStatusUndefined',
  '-170050': 'Launcher_ExitStatusNotFound',
  '-170060': 'Launcher_SubmitAppTransientError',
  '-170070': 'Launcher_SubmitAppUnKnownError',
  '-170080': 'Launcher_SubmitAppNonTransientError',
  '-170090': 'Launcher_StopFrameworkRequested',
  '-170091': 'Launcher_TaskStoppedOnAppCompletion',
  '-170110': 'AM_KilledByUser',
  '-170120': 'AM_InternalTransientError',
  '-170130': 'AM_InternalNonTransientError',
  '-170140': 'AM_InternalUnKnownError',
  '-170150': 'AM_RMResyncLost',
  '-170160': 'AM_RMResyncExceed',
  '-1710000': 'Container_InvalidExitStatus',
  '-1725170': 'Container_NotAvailableExitStatus',
  '-171000': 'Container_Aborted',
  '-171001': 'Container_Expired',
  '-171010': 'Container_NodeDisksFailed',
  '-171020': 'Container_Preempted',
  '-171060': 'Container_KilledByRM',
  '-171050': 'Container_KilledByAM',
  '-171070': 'Container_KilledAfterCompleted',
  '-171100': 'Container_StartFailed',
  '-171300': 'Container_RMResyncLost',
  '-171400': 'Container_RMResyncExceed',
  '-171500': 'Container_MigrateTaskRequested',
  '-171040': 'Container_PhysicalMemoryExceeded',
  '-171030': 'Container_VirtualMemoryExceeded',
  '-171080': 'Container_ExternalUtilizationSpiked',
  '-171081': 'Container_Reclaimed',
  '-171090': 'Container_PortConflict',
  '-171091': 'Container_AgentExpiry',
  '-510010': 'UserApp_TransientError',
  '-510020': 'UserApp_NonTransientError',
  '-171370': 'UserApp_FORCE_KILLED',
  '-171430': 'UserApp_TERMINATED',
  '-171540': 'UserApp_LOST',
  '-172000': 'Agent_InternalTransientError',
  '-172001': 'Agent_InternalNonTransientError',
  '-172002': 'Agent_InternalUnKnownError',
};

export default class TaskRoleContainerList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jobStatus: props.jobStatus,
      appId: props.appId,
      monacoProps: null,
      monacoTitle: '',
      monacoFooterButton: null,
      logUrl: null,
      ordering: new Ordering(),
      filter: new Filter(),
      selectedTaskIndex: undefined,
      selectedGroupWay: 'Ungrouped',
    };

    this.onDismiss = this.onDismiss.bind(this);
    this.showContainerLog = this.showContainerLog.bind(this);
    this.onRenderRow = this.onRenderRow.bind(this);
    this.logAutoRefresh = this.logAutoRefresh.bind(this);
    this.handleTaskInfo = this.handleTaskStatuses.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.applySortProps = this.applySortProps.bind(this);
    this.onColumnClick = this.onColumnClick.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onClearClick = this.onClearClick.bind(this);
    this.getGroupOptions = this.getGroupOptions.bind(this);
    this.getDetailList = this.getDetailList.bind(this);
    this.renderDetailList = this.renderDetailList.bind(this);
    this.getStateGroups = this.getStateGroups.bind(this);
    this.renderDebugList = this.renderDebugList.bind(this);
  }

  logAutoRefresh() {
    const {logUrl} = this.state;
    void getContainerLog(logUrl).then(({text, fullLogLink}) => this.setState(
      (prevState) => prevState.logUrl === logUrl && {
        monacoProps: {value: text},
        monacoFooterButton: (
          <PrimaryButton
            text='View Full Log'
            target='_blank'
            styles={{
              rootFocused: [ColorClassNames.white],
            }}
            href={fullLogLink}
          />
        ),
      }
    )).catch((err) => this.setState(
      (prevState) => prevState.logUrl === logUrl && {monacoProps: {value: err.message}}
    ));
  }

  onDismiss() {
    this.setState({
      monacoProps: null,
      monacoTitle: '',
      monacoFooterButton: null,
      logUrl: null,
    });
  }

  showContainerLog(logUrl, title) {
    this.setState({
      monacoProps: {value: 'Loading...'},
      monacoTitle: title,
      logUrl,
    }, () => {
      this.logAutoRefresh(); // start immediately
    });
  }

  showSshInfo(id) {
    const {sshInfo} = this.context;
    const containerSshInfo = sshInfo && sshInfo.containers.find((x) => x.id === id);
    if (!containerSshInfo) {
      this.setState({
        monacoProps: {value: 'This job does not contain SSH info.'},
        monacoTitle: `SSH to ${id}`,
      });
    } else {
      const res = [];
      res.push('# Step 1. Open a Bash shell terminal.');
      res.push('# Step 2: Download the private key:');
      res.push(`wget '${sshInfo.keyPair.privateKeyDirectDownloadLink}' -O ${sshInfo.keyPair.privateKeyFileName}`);
      res.push('# Step 3: Set correct permission for the key file:');
      res.push(`chmod 600 ${sshInfo.keyPair.privateKeyFileName}`);
      res.push('# Step 4: Connect to the container:');
      res.push(`ssh -i ${sshInfo.keyPair.privateKeyFileName} -p ${containerSshInfo.sshPort} root@${containerSshInfo.sshIp}`);
      res.push('');
      this.setState({
        monacoProps: {
          value: res.join('\n'),
          options: {
            wordWrap: 'off',
            readOnly: true,
          },
        },
        monacoTitle: `SSH to ${id}`,
      });
    }
  }

  handleTaskStatuses(taskStatuses) {
    return taskStatuses.map((taskStatus) => {
      taskStatus.retryDetailsUser = taskStatus.retryDetails.user;
      taskStatus.retryDetailsPlatform = taskStatus.retryDetails.platform;
      taskStatus.retryDetailsUnknown = taskStatus.retryDetails.unknown;
      taskStatus.state = taskStatus.taskState;
      taskStatus.executionType = 'START';
      const end = taskStatus.containerCompletedTimestamp === 0 ? new Date().getTime() : taskStatus.containerCompletedTimestamp;
      taskStatus.duration = end - taskStatus.containerLaunchedTimestamp;
      return taskStatus;
    });
  }

  getColumns() {
    const { filter } = this.state;
    const { jobName, appId, taskRoleName, taskInfo } = this.props;
    const params = new URLSearchParams(window.location.search);
    const subCluster = params.get('subCluster');
    const columns = [
      {
        key: 'taskIndex',
        name: 'No.',
        headerClassName: FontClassNames.medium,
        minWidth: 50,
        maxWidth: 50,
        isResizable: true,
        onRender: (item, idx) => {
          return !isNil(idx) && (
            <div className={FontClassNames.medium}>
              {item.taskIndex}
            </div>
          );
        },
      },
      {
        key: 'containerId',
        name: 'Container ID',
        headerClassName: FontClassNames.medium,
        minWidth: 100,
        maxWidth: 500,
        isResizable: true,
        onRender: (item) => {
          const id = item.containerId;
          return !isNil(id) && (
            <div className={c(t.truncate, FontClassNames.medium)}>
              {id}
            </div>
          );
        },
      },
      {
        key: 'retryDetailsUser',
        name: 'Customer Retry',
        className: FontClassNames.medium,
        headerClassName: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 150,
        isResizable: true,
        onRender: (item) => {
          const userRetryCount = item.retryDetails.user;
          return !isNil(userRetryCount) && (
            <div className={c(t.truncate, FontClassNames.medium)}>
              {userRetryCount}
            </div>
          );
        },
      },
      {
        key: 'retryDetailsPlatform',
        name: 'System Retry',
        className: FontClassNames.medium,
        headerClassName: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 150,
        isResizable: true,
        onRender: (item) => {
          const platformRetryCount = item.retryDetails.platform;
          return !isNil(platformRetryCount) && (
            <div className={c(t.truncate, FontClassNames.medium)}>
              {platformRetryCount}
            </div>
          );
        },
      },
      {
        key: 'retryDetailsUnknown',
        name: 'Unknown Retry',
        className: FontClassNames.medium,
        headerClassName: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 150,
        isResizable: true,
        onRender: (item) => {
          const unknownRetryCount = item.retryDetails.unknown;
          return !isNil(unknownRetryCount) && (
            <div className={c(t.truncate, FontClassNames.medium)}>
              {unknownRetryCount}
            </div>
          );
        },
      },
      {
        key: 'containerHostName',
        name: 'Running Node',
        className: FontClassNames.medium,
        headerClassName: FontClassNames.medium,
        minWidth: 150,
        maxWidth: 200,
        isResizable: true,
        fieldName: 'containerHostName',
      },
      {
        key: 'taskState',
        name: 'Status',
        headerClassName: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 150,
        isResizable: true,
        isFiltered: filter.statuses.size > 0,
        onRender: (item) => <StatusBadge status={capitalize(item.taskState)}/>,
      },
      {
        key: 'duration',
        name: 'Duration',
        headerClassName: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 150,
        isResizable: true,
        onRender: (item) => {
          return !isNil(item) && (
            <div className={c(t.truncate, FontClassNames.medium)}>
              {getContainerDurationString(item)}
            </div>
          );
        },
      },
      {
        key: 'Dump',
        name: 'Dump',
        headerClassName: FontClassNames.medium,
        className: FontClassNames.medium,
        minWidth: 240,
        maxWidth: 240,
        isResizable: true,
        onRender: (item) => {
          return (
            <DumpList
              executorStatus={capitalize(item.taskState)}
              jobStatus={this.state.jobStatus}
              jobName={jobName}
              appId={appId}
              jobType='LAUNCHER'
              taskIndex={item.taskIndex}
              taskRoleName={taskRoleName}
              containerId={item.containerId}
              containerLogUrl={item.containerLog}
              logsLinkHref={`/logView.html?jobName=${jobName}&jobType=LAUNCHER&taskIndex=${item.taskIndex}&taskRoleName=${taskRoleName}&subCluster=${subCluster}&containerLogUrl=${item.containerLog}`}
            ></DumpList>
          );
        },
      },
      {
        key: 'Logs',
        name: 'Logs',
        headerClassName: FontClassNames.medium,
        className: FontClassNames.medium,
        minWidth: 40,
        maxWidth: 55,
        isResizable: true,
        onRender: (item) => (
          <Link
            href={`/logView.html?jobName=${jobName}&jobType=LAUNCHER&taskIndex=${item.taskIndex}&taskRoleName=${taskRoleName}&subCluster=${subCluster}&containerLogUrl=${item.containerLog}`}
            onClick={(event) => {
              event.preventDefault();
              window.open(event.currentTarget.href, '_blank', 'location=no, menubar=no, status=no');
            }}
          >Logs</Link>
        ),
      },
      {
        key: 'containerExitCode',
        name: 'Exit Code',
        headerClassName: FontClassNames.medium,
        className: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 150,
        isResizable: true,
        onRender: (item) => {
          const exitCode = item.containerExitCode;
          return !isNil(exitCode) && (
            <div className={c(t.truncate, FontClassNames.medium)}>
              {(containerErrorCode.hasOwnProperty(exitCode) ?
                containerErrorCode[exitCode] : containerErrorCode[-170040])
                + `(${exitCode})`}
            </div>
          );
        },
      },
      {
        key: 'containerExitType',
        name: 'Exit Type',
        headerClassName: FontClassNames.medium,
        className: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 150,
        isResizable: true,
        onRender: (item) => {
          const exitType = item.containerExitType;
          return !isNil(exitType) && (
            <div className={c(t.truncate, FontClassNames.medium)}>
              {exitType}
            </div>
          );
        },
      },
      {
        key: 'containerExitDiagnostics',
        name: 'Exit Diagnostics',
        headerClassName: FontClassNames.medium,
        className: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 300000,
        isResizable: true,
        onRender: (item) => {
          const exitDiagnostics = item.containerExitDiagnostics;
          return !isNil(exitDiagnostics) && (
            <span className={c(t.pointer)} title={exitDiagnostics}>
              {exitDiagnostics}
            </span>
          );
        },
      },
    ];

    return columns.map(column => this.applySortProps(column));
  }

  onRenderRow(props) {
    return <DetailsRow {...props} styles={{
      root: {
        color: theme.palette.black,
    }}}/>;
  }

  getGroupOptions() {
    return [
      { key: 'Ungrouped', text: (<div className={t.mr2}>{'Ungrouped'}</div>) },
      { key: 'Group by Status', text: (<div className={t.mr2}>{'Group by Status'}</div>) },
      { key: 'Group by Error message', text: (<div className={t.mr2}>{'Group by Error message'}</div>) },
    ];
  }

  renderDebugList(errorGroups) {
    let rs = [];
    let index = 0;
    for (let errorMsg of Object.keys(errorGroups)) {
      rs.push(
        <div className={c(t.mr1, t.bgWhite)} key={index++}>
          <div className={c(t.mb2, t.ml2)}>
            <span>
              <b>Error Message: </b>
            </span>
            {errorMsg ? errorMsg : ''}
          </div>
          <CommonDebugTable
            tableProperty={
              new TableProperty(
                this.getColumns(),
                errorGroups[errorMsg],
                'taskIndex',
                'taskIndex',
                5
              )
            }
          />
        </div>);
    }
    return (<>{rs}</>);
  }

  renderDetailList(items, groups = null) {
    return <DetailsList
      columns={this.getColumns()}
      disableSelectionZone
      items={items}
      groups={groups}
      groupProps={
        {
          headerProps: {
            onRenderTitle: ((props) => {
              return (
                  <div className={FontClassNames.medium}>
                    {`${props?.group?.name}` + (isNil(props?.group?.count) ? `` : ` (${props.group.count})`)}
                  </div>
              );
            }),
          }
        }
      }
      layoutMode={DetailsListLayoutMode.justified}
      selectionMode={SelectionMode.none}
      onRenderRow={this.onRenderRow}
    />;
  }

  getStateGroups(taskInfo) {
    const rs = {};
    taskInfo.taskStatuses.map((e) => {
      if (!rs.hasOwnProperty(e.taskState)) {
        rs[e.taskState] = [];
      }
      rs[e.taskState].push(e);
    });
    return rs;
  }

  getDetailList(taskInfo) {
    const { ordering, filter, selectedGroupWay } = this.state;
    const status = this.handleTaskStatuses(taskInfo.taskStatuses);
    switch (selectedGroupWay) {
      case 'Ungrouped':
        return this.renderDetailList(ordering.apply(filter.apply(status)));
      case 'Group by Status': {
        let stateGroups = this.getStateGroups(taskInfo);
        let groups = [];
        let items = [];
        for (let eIndex in stateGroups) {
          if (stateGroups.hasOwnProperty(eIndex)) {
            const tmpArray = this.handleTaskStatuses(stateGroups[eIndex]);
            groups.push(
              {
                key: eIndex,
                name: capitalize(eIndex),
                startIndex: items.length,
                count: tmpArray.length,
                level: 0
              }
            );
            items = items.concat(ordering.apply(filter.apply(tmpArray)));
          }
        }
        return this.renderDetailList(items, groups);
      }
      case 'Group by Error message': {
        return this.renderDebugList(FrameworkContainerErrors.getErrorGroups(taskInfo));
      }
    }
  }

  getStatus() {
    return {
      key: 'status',
      name: 'Status',
      buttonStyles: {root: {backgroundColor: 'transparent'}},
      iconProps: {
        iconName: 'Clock',
      },
      subMenuProps: {
        items: Object.keys(statuses).map(statuse => this.getItem.call(this, statuse)).concat([{
          key: 'divider',
          itemType: ContextualMenuItemType.Divider,
        },
        {
          key: 'clear',
          text: 'Clear',
          onClick: this.onClearClick,
        },
        ]),
      },
      commandBarButtonAs: FilterButton
    };
  }

  onClick(event, {key, checked}) {
    const { filter } = this.state;
    const statuses = new Set(filter.statuses);
    if (checked) {
      statuses.delete(key);
    } else {
      statuses.add(key);
    }
    this.setState({filter: new Filter('', '', '', statuses)})
  }

  getItem(key) {
    const { filter } = this.state;
    return {
      key,
      text: key,
      canCheck: true,
      checked: filter.statuses.has(key),
      onClick: this.onClick,
    };
  }

  onClearClick(event) {
    this.setState({filter: new Filter('', '', '', new Set())});
  }

  onColumnClick(event, column) {
    const { ordering: {field, descending, stringAscending} } = this.state;
    if (field === column.key) {
      this.setState({ordering: new Ordering(field, !descending, !stringAscending)});
    } else {
      this.setState({ordering: new Ordering(column.key, descending, stringAscending)});
    }
  }

  applySortProps(column) {
    const { ordering } = this.state;
    if (column.key === 'Logs') return column;
    column.isSorted = ordering.field === column.key;
    column.isSortedDescending = ordering.descending;
    column.onColumnClick = this.onColumnClick;
    return column;
  }

  render() {
    const {monacoTitle, monacoProps, monacoFooterButton, logUrl, ordering, filter, selectedTaskIndex} = this.state;
    const {className, style, taskInfo, jobName, taskRoleName} = this.props;
    return (
      <div className={className} style={{ backgroundColor: theme.palette.white, ...style }}>
        <ThemeProvider theme={theme}>
          <CommandBar
            farItems={[{
              key: 'ChoiceGroup',
              text: (
                <ChoiceGroup
                  options={this.getGroupOptions()}
                  defaultSelectedKey={'Ungrouped'}
                  onChange={(ev, option) => {
                    this.setState({ selectedGroupWay: option.key });
                  }}
                  styles={{
                    flexContainer: { display: 'flex' }
                  }}
                />),
            }]}
            styles={{ root: { backgroundColor: 'transparent', padding: 0, lineHeight: '150%' } }}
          />
          {this.getDetailList(taskInfo)}
        </ThemeProvider>
        {/* Timer */}
        <Timer interval={isNil(monacoProps) || isEmpty(logUrl) ? null : interval} func={this.logAutoRefresh} />
        {/* Monaco Editor Panel */}
        <MonacoPanel
          isOpen={!isNil(monacoProps)}
          onDismiss={this.onDismiss}
          title={monacoTitle}
          monacoProps={monacoProps}
          footer={monacoFooterButton}
        />
      </div>
    );
  }
}

TaskRoleContainerList.contextType = Context;

TaskRoleContainerList.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  taskInfo: PropTypes.object,
  jobName: PropTypes.string,
  taskRoleName: PropTypes.string,
};
