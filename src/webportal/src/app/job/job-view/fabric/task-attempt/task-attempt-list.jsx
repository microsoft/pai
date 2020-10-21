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

import { ColorClassNames, FontClassNames, getTheme } from '@uifabric/styling';
import c from 'classnames';
import { capitalize, isEmpty, isNil, flatten } from 'lodash';
import { DateTime, Interval } from 'luxon';
import { CommandBarButton, PrimaryButton, Stack } from 'office-ui-fabric-react';
import {
  DetailsList,
  SelectionMode,
  DetailsRow,
  DetailsListLayoutMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';

import localCss from './task-role-container-list.scss';
import t from '../../../../components/tachyons.scss';

import { getContainerLog } from './conn';
import config from '../../../../config/webportal.config';
import MonacoPanel from '../../../../components/monaco-panel';
import StatusBadge from '../../../../components/status-badge';
import CopyButton from '../../../../components/copy-button';
import { getDurationString } from '../../../../components/util/job';

const theme = getTheme();

const IPTooltipContent = ({ ip }) => {
  return (
    <div>
      <Stack horizontal verticalAlign='center'>
        <div>{`Container IP: ${ip}`}</div>
        <div>
          <CopyButton value={ip} />
        </div>
      </Stack>
    </div>
  );
};

IPTooltipContent.propTypes = {
  ip: PropTypes.string,
};

const PortTooltipContent = ({ ports }) => {
  const { spacing } = getTheme();
  return (
    <div>
      <table>
        <tbody>
          {Object.entries(ports).map(([key, val]) => (
            <tr key={`port-${key}`}>
              <td style={{ padding: spacing.s2 }}>{`${key}:`}</td>
              <td style={{ padding: spacing.s2 }}>{val}</td>
              <td>
                <CopyButton value={val} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

PortTooltipContent.propTypes = {
  ports: PropTypes.object,
};

export default class TaskAttemptList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      monacoProps: null,
      monacoTitle: '',
      monacoFooterButton: null,
      logUrl: null,
      items: props.taskAttempts,
      ordering: { field: null, descending: false },
      hideDialog: true,
    };

    this.showSshInfo = this.showSshInfo.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.showContainerLog = this.showContainerLog.bind(this);
    this.onRenderRow = this.onRenderRow.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.taskAttempts !== this.props.taskAttempts) {
      this.setState({ items: this.props.taskAttempts });
    }
  }

  logAutoRefresh() {
    const { logUrl } = this.state;
    getContainerLog(logUrl)
      .then(({ text, fullLogLink }) =>
        this.setState(
          prevState =>
            prevState.logUrl === logUrl && {
              monacoProps: { value: text },
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
            },
        ),
      )
      .catch(err =>
        this.setState(
          prevState =>
            prevState.logUrl === logUrl && {
              monacoProps: { value: err.message },
            },
        ),
      );
  }

  onDismiss() {
    this.setState({
      monacoProps: null,
      monacoTitle: '',
      monacoFooterButton: null,
      logUrl: null,
    });
  }

  getTimeDuration(startMs, endMs) {
    const start = startMs && DateTime.fromMillis(startMs);
    const end = endMs && DateTime.fromMillis(endMs);
    if (start) {
      return Interval.fromDateTimes(start, end || DateTime.utc()).toDuration([
        'days',
        'hours',
        'minutes',
        'seconds',
      ]);
    } else {
      return null;
    }
  }

  showContainerLog(logUrl, logType) {
    let title;
    let logHint;

    if (config.logType === 'yarn') {
      logHint = 'Last 4096 bytes';
    } else if (config.logType === 'log-manager') {
      logHint = 'Last 16384 bytes';
    } else {
      logHint = '';
    }
    switch (logType) {
      case 'stdout':
        title = `Standard Output (${logHint})`;
        break;
      case 'stderr':
        title = `Standard Error (${logHint})`;
        break;
      case 'stdall':
        title = `User logs (${logHint}. Notice: The logs may out of order when merging stdout & stderr streams)`;
        break;
      default:
        throw new Error(`Unsupported log type`);
    }
    this.setState(
      {
        monacoProps: { value: 'Loading...' },
        monacoTitle: title,
        logUrl,
      },
      () => {
        this.logAutoRefresh(); // start immediately
      },
    );
  }

  showSshInfo(id, containerPorts, containerIp) {
    const { sshInfo, jobConfig } = this.context;
    const containerSshInfo =
      sshInfo && sshInfo.containers.find(x => x.id === id);
    if (config.launcherType !== 'k8s') {
      if (!containerSshInfo) {
        const res = [];
        res.push('This job does not contain SSH info.');
        res.push(
          'Please note that if your docker image does not have openssh-server and curl packages, SSH will not be enabled.\n',
        );
        res.push(
          'Solution 1: Use one of the recommended docker images on the submission page.',
        );
        res.push(
          'Solution 2: Use your own image, but enable SSH for it. Please follow the instructions on https://aka.ms/AA5u4sq to do such work.',
        );
        this.setState({
          monacoProps: { value: res.join('\n') },
          monacoTitle: `SSH to ${id}`,
        });
      } else {
        const res = [];
        res.push('# Step 1. Open a Bash shell terminal.');
        res.push('# Step 2: Download the private key:');
        res.push(
          `wget '${sshInfo.keyPair.privateKeyDirectDownloadLink}' -O ${sshInfo.keyPair.privateKeyFileName}`,
        );
        res.push('# Step 3: Set correct permission for the key file:');
        res.push(`chmod 400 ${sshInfo.keyPair.privateKeyFileName}`);
        res.push('# Step 4: Connect to the container:');
        res.push(
          `ssh -i ${sshInfo.keyPair.privateKeyFileName} -p ${containerSshInfo.sshPort} root@${containerSshInfo.sshIp}`,
        );
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
    } else {
      const res = [];
      let hasUserSsh = false;
      if (
        'extras' in jobConfig &&
        'com.microsoft.pai.runtimeplugin' in jobConfig.extras
      ) {
        for (const pluginSetting of jobConfig.extras[
          'com.microsoft.pai.runtimeplugin'
        ]) {
          if (pluginSetting.plugin === 'ssh') {
            if (
              'parameters' in pluginSetting &&
              'userssh' in pluginSetting.parameters &&
              !isEmpty(pluginSetting.parameters.userssh)
            ) {
              hasUserSsh = true;
              break;
            }
          }
        }
      }
      if (hasUserSsh) {
        res.push(
          'You can connect to this container by one of the following commands if SSH is set up properly: \n',
        );
        res.push(`1. Use your default SSH private key:\n`);
        res.push(`ssh -p ${containerPorts.ssh} root@${containerIp}\n`);
        res.push(`2. Use a pre-downloaded SSH private key:\n`);
        res.push(
          `On Windows:\nssh -p ${containerPorts.ssh} -i <your-private-key-file-path> root@${containerIp}\n`,
        );
        res.push(
          `On Unix-like System:\nchmod 400 <your-private-key-file-path> && ssh -p ${containerPorts.ssh} -i <your-private-key-file-path> root@${containerIp}\n\n`,
        );
        res.push(
          `If you are using a different username in your docker, please change "root" to your pre-defined username.`,
        );
      } else {
        res.push('This job does not contain SSH info.');
        res.push(
          'If you want to use SSH, please enable it in the "Tools -> SSH" Section on the Job Submission Page.',
        );
      }
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

  getTaskPropertyFromColumnKey(item, key) {
    if (key === 'exitType') {
      return !isNil(item.containerExitSpec) &&
        !isNil(item.containerExitSpec.type)
        ? item.containerExitSpec.type
        : null;
    }
    return item[key];
  }

  onRenderRow(props) {
    return (
      <DetailsRow
        {...props}
        styles={{
          root: {
            color: theme.palette.black,
          },
        }}
      />
    );
  }

  render() {
    const { monacoTitle, monacoProps, monacoFooterButton, items } = this.state;
    return (
      <div>
        <DetailsList
          styles={{ root: { overflow: 'auto', padding: '16px' } }}
          columns={this.getColumns()}
          disableSelectionZone
          items={items}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          onRenderRow={this.onRenderRow}
        />
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

  getColumns() {
    const defaultColumns = [
      {
        key: 'taskAttemptIndex',
        name: 'Task Attempt Index',
        minWidth: 120,
        headerClassName: FontClassNames.medium,
        isResizable: true,
        onRender: (item, idx) => {
          return (
            <div className={FontClassNames.mediumPlus}>{item.attemptId}</div>
          );
        },
      },
      {
        key: 'taskAttemtState',
        name: 'Task Attempt State',
        minWidth: 120,
        headerClassName: FontClassNames.medium,
        isResizable: true,
        onRender: item => (
          <StatusBadge status={capitalize(item.attemptState)} />
        ),
      },
      {
        key: 'ip',
        name: 'IP',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.medium,
        minWidth: 90,
        maxWidth: 140,
        isResizable: true,
        fieldName: 'containerIp',
        onRender: item => {
          const ip = item.containerIp;
          return !isNil(ip) && <div>{ip}</div>;
        },
      },
      {
        key: 'ports',
        name: 'Ports',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.medium,
        minWidth: 150,
        maxWidth: 300,
        isResizable: true,
        onRender: item => {
          const ports = item.containerPorts;
          return (
            !isNil(ports) && (
              <div className={c(t.truncate)}>
                {flatten(
                  Object.entries(ports).map(([key, val], idx) => [
                    idx !== 0 && (
                      <span className={t.ml2} key={`gap-${idx}`}></span>
                    ),
                    `${key}: ${val}`,
                  ]),
                )}
              </div>
            )
          );
        },
      },
      {
        key: 'info',
        name: 'Info & Logs',
        className: localCss.pa0I,
        headerClassName: FontClassNames.medium,
        minWidth: 300,
        maxWidth: 500,
        onRender: item => (
          <div
            className={c(t.h100, t.flex, t.justifyStart, t.itemsCenter, t.ml1)}
          >
            <div className={c(t.flex)} style={{ height: 40 }}>
              <CommandBarButton
                className={FontClassNames.mediumPlus}
                styles={{
                  root: { backgroundColor: 'transparent' },
                  rootDisabled: { backgroundColor: 'transparent' },
                }}
                iconProps={{ iconName: 'TextDocument' }}
                text='Stdout'
                onClick={() =>
                  this.showContainerLog(
                    `${item.containerLog}user.pai.stdout`,
                    'stdout',
                  )
                }
                disabled={isNil(item.containerId) || isNil(item.containerIp)}
              />
              <CommandBarButton
                className={FontClassNames.mediumPlus}
                styles={{
                  root: { backgroundColor: 'transparent' },
                  rootDisabled: { backgroundColor: 'transparent' },
                }}
                iconProps={{ iconName: 'Error' }}
                text='Stderr'
                onClick={() =>
                  this.showContainerLog(
                    `${item.containerLog}user.pai.stderr`,
                    'stderr',
                  )
                }
                disabled={isNil(item.containerId) || isNil(item.containerIp)}
              />
            </div>
          </div>
        ),
      },
      {
        key: 'exitType',
        name: 'Exit Type',
        headerClassName: FontClassNames.medium,
        minWidth: 150,
        maxWidth: 200,
        isResizable: true,
        onRender: item => {
          return (
            <div className={c(FontClassNames.mediumPlus)}>
              {!isNil(item.containerExitSpec) &&
              !isNil(item.containerExitSpec.type)
                ? item.containerExitSpec.type
                : null}
            </div>
          );
        },
      },
      {
        key: 'taskAttemptExitCode',
        name: 'Exit Code',
        minWidth: 230,
        headerClassName: FontClassNames.medium,
        isResizable: true,
        onRender: (item, idx) => {
          return isNil(item.containerExitSpec) ? (
            <div className={FontClassNames.mediumPlus}>
              {item.containerExitCode}
            </div>
          ) : (
            <div className={FontClassNames.mediumPlus}>
              {`${item.containerExitCode} (${item.containerExitSpec.phrase})`}
            </div>
          );
        },
      },
      {
        key: 'runningStartTime',
        name: 'Running Start Time',
        headerClassName: FontClassNames.medium,
        minWidth: 180,
        maxWidth: 200,
        isResizable: true,
        onRender: item => {
          return (
            <div className={c(FontClassNames.mediumPlus)}>
              {isNil(item.currentAttemptLaunchedTime)
                ? 'N/A'
                : DateTime.fromMillis(
                    item.currentAttemptLaunchedTime,
                  ).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}
            </div>
          );
        },
      },
      {
        key: 'taskAttemptDuration',
        name: 'Running Duration',
        minWidth: 150,
        headerClassName: FontClassNames.medium,
        isResizable: true,
        onRender: (item, idx) => {
          return (
            <div className={FontClassNames.mediumPlus}>
              {getDurationString(
                this.getTimeDuration(
                  item.currentAttemptLaunchedTime,
                  item.currentAttemptCompletedTime,
                ),
              )}
            </div>
          );
        },
      },
      {
        key: 'nodeName',
        name: 'Node Name',
        headerClassName: FontClassNames.medium,
        minWidth: 100,
        isResizable: true,
        onRender: item => {
          return (
            <div className={c(FontClassNames.mediumPlus)}>
              {item.containerNodeName}
            </div>
          );
        },
      },
      {
        key: 'exitDiagonostic',
        name: 'Exit Diagnostics',
        headerClassName: FontClassNames.medium,
        minWidth: 200,
        isResizable: true,
        onRender: item => {
          return (
            <CommandBarButton
              className={FontClassNames.mediumPlus}
              styles={{
                root: { backgroundColor: 'transparent' },
                rootDisabled: { backgroundColor: 'transparent' },
              }}
              disabled={
                isNil(item.containerExitDiagnostics) &&
                isNil(item.containerExitSpec)
              }
              text='Show Exit Diagnostics'
              onClick={() => {
                const result = [];
                // exit spec
                const spec = item.containerExitSpec;
                if (!isNil(spec)) {
                  // divider
                  result.push(Array.from({ length: 80 }, () => '-').join(''));
                  result.push('');
                  // content
                  result.push('[Exit Spec]');
                  result.push('');
                  result.push(yaml.safeDump(spec));
                  result.push('');
                }

                // diagnostics
                const diag = item.containerExitDiagnostics;
                if (!isNil(diag)) {
                  // divider
                  result.push(Array.from({ length: 80 }, () => '-').join(''));
                  result.push('');
                  // content
                  result.push('[Exit Diagnostics]');
                  result.push('');
                  result.push(diag);
                  result.push('');
                }

                this.setState({
                  monacoProps: {
                    language: 'text',
                    value: result.join('\n'),
                    options: {
                      wordWrap: 'off',
                      readOnly: true,
                    },
                  },
                  monacoTitle: `Task Exit Diagonostics`,
                });
              }}
            />
          );
        },
      },
      {
        key: 'containerId',
        name: 'Container ID',
        headerClassName: FontClassNames.medium,
        minWidth: 300,
        isResizable: true,
        onRender: item => {
          const id = item.containerId;
          return (
            !isNil(id) && (
              <div className={c(t.truncate, FontClassNames.mediumPlus)}>
                {id}
              </div>
            )
          );
        },
      },
    ];
    const columns = defaultColumns;
    return columns;
  }
}

TaskAttemptList.propTypes = {
  taskAttempts: PropTypes.arrayOf(PropTypes.object),
};
