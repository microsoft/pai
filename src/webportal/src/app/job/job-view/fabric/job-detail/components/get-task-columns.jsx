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

import { ThemeProvider } from '@uifabric/foundation';
import {
  createTheme,
  ColorClassNames,
  FontClassNames,
  FontSizes,
  getTheme,
} from '@uifabric/styling';
import c from 'classnames';
import { capitalize, isEmpty, isNil, flatten } from 'lodash';
import { DateTime } from 'luxon';
import {
  CommandBarButton,
  PrimaryButton,
  TooltipHost,
  DirectionalHint,
  Icon,
  Stack,
  IconButton,
} from 'office-ui-fabric-react';
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
import t from '../../../../../components/tachyons.scss';

import Context from './context';
import Timer from './timer';
import { getContainerLog } from '../conn';
import { parseGpuAttr, printDateTime } from '../util';
import config from '../../../../../config/webportal.config';
import MonacoPanel from '../../../../../components/monaco-panel';
import StatusBadge from '../../../../../components/status-badge';
import CopyButton from '../../../../../components/copy-button';
import TaskAttemptDialog from './task-attempt-dialog';

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

export const getTaskColumns = showMoreDiagnostics => {
  const taskStateColumn = this.applySortProps({
    key: 'taskState',
    name: 'Task State',
    headerClassName: FontClassNames.medium,
    minWidth: 100,
    maxWidth: 150,
    isResizable: true,
    onRender: item => <StatusBadge status={capitalize(item.taskState)} />,
  });
  const exitTypeColumn = this.applySortProps({
    key: 'exitType',
    name: 'Exit Type',
    headerClassName: FontClassNames.medium,
    minWidth: 150,
    maxWidth: 200,
    isResizable: true,
    onRender: item => {
      return (
        <div className={c(FontClassNames.mediumPlus)}>
          {!isNil(item.containerExitSpec) && !isNil(item.containerExitSpec.type)
            ? item.containerExitSpec.type
            : null}
        </div>
      );
    },
  });
  const defaultColumns = [
    {
      key: 'taskIndex',
      name: 'Task Index',
      headerClassName: FontClassNames.medium,
      maxWidth: 50,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>{item.taskIndex}</div>
        );
      },
    },
    taskStateColumn,
    exitTypeColumn,
    {
      key: 'retries',
      name: 'Task Retries',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <Stack horizontal verticalAlign='center' gap='m'>
            <div className={FontClassNames.mediumPlus}>{item.retries}</div>
            <IconButton
              iconProps={{ iconName: 'Error' }}
              onClick={this.toggleHideDialog}
            />
          </Stack>
        );
      },
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
        return (
          !isNil(ip) && (
            <div>
              <TooltipHost
                calloutProps={{
                  isBeakVisible: false,
                }}
                tooltipProps={{
                  onRenderContent: () => <IPTooltipContent ip={ip} />,
                }}
                directionalHint={DirectionalHint.topLeftEdge}
              >
                <div>{ip}</div>
              </TooltipHost>
            </div>
          )
        );
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
            <div>
              <TooltipHost
                calloutProps={{
                  isBeakVisible: false,
                }}
                tooltipProps={{
                  onRenderContent: () => <PortTooltipContent ports={ports} />,
                }}
                directionalHint={DirectionalHint.topLeftEdge}
              >
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
              </TooltipHost>
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
              className={c(FontClassNames.mediumPlus)}
              styles={{
                root: { backgroundColor: 'transparent' },
                rootDisabled: { backgroundColor: 'transparent' },
              }}
              iconProps={{ iconName: 'CommandPrompt' }}
              text='SSH Info'
              onClick={() => {
                this.showSshInfo(
                  item.containerId,
                  item.containerPorts,
                  item.containerIp,
                );
              }}
              disabled={isNil(item.containerId) || item.taskState !== 'RUNNING'}
            />
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
            <CommandBarButton
              className={FontClassNames.mediumPlus}
              styles={{
                root: { backgroundColor: 'transparent' },
                rootDisabled: { backgroundColor: 'transparent' },
              }}
              menuIconProps={{ iconName: 'More' }}
              menuProps={{
                items: [
                  {
                    key: 'mergedLog',
                    name: 'Stdout+Stderr',
                    iconProps: { iconName: 'TextDocument' },
                    disabled: isNil(item.containerId),
                    onClick: () =>
                      this.showContainerLog(
                        `${item.containerLog}user.pai.all`,
                        'stdall',
                      ),
                  },
                  {
                    key: 'trackingPage',
                    name:
                      config.launcherType === 'yarn'
                        ? 'Go to Yarn Tracking Page'
                        : 'Browse log folder',
                    iconProps: { iconName: 'Link' },
                    href: isNil(item.containerLog)
                      ? item.containerLog
                      : item.containerLog.replace('/tail/', '/'),
                    target: '_blank',
                  },
                ],
              }}
              disabled={isNil(item.containerId)}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'gpus',
      name: 'GPUs',
      className: FontClassNames.mediumPlus,
      headerClassName: FontClassNames.medium,
      minWidth: 35,
      maxWidth: 60,
      isResizable: true,
      onRender: item => {
        const gpuAttr = isNil(item.containerGpus)
          ? null
          : parseGpuAttr(item.containerGpus);
        if (isNil(gpuAttr)) {
          return null;
        } else if (gpuAttr.length === 0) {
          return <div>0</div>;
        } else {
          return (
            <div>
              <TooltipHost
                calloutProps={{
                  isBeakVisible: false,
                }}
                tooltipProps={{
                  onRenderContent: () => (
                    <div>
                      {gpuAttr.map(x => (
                        <span
                          className={t.mr2}
                          key={`gpu-${x}`}
                        >{`#${x}`}</span>
                      ))}
                    </div>
                  ),
                }}
                directionalHint={DirectionalHint.topLeftEdge}
              >
                <Stack horizontal gap='s1'>
                  <div>{gpuAttr.length}</div>
                  <div>
                    <Icon
                      iconName='Info'
                      styles={{
                        root: [
                          { fontSize: FontSizes.small },
                          ColorClassNames.neutralSecondary,
                        ],
                      }}
                    />
                  </div>
                </Stack>
              </TooltipHost>
            </div>
          );
        }
      },
    },
    {
      key: 'exitCode',
      name: 'Exit Code',
      headerClassName: FontClassNames.medium,
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
      onRender: item => {
        return (
          <div className={c(FontClassNames.mediumPlus)}>
            {item.containerExitCode}
          </div>
        );
      },
    },
  ];
  const attemptInfoColumns = [
    {
      key: 'taskUid',
      name: 'Task Uid',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.taskUid}</div>;
      },
    },
    {
      key: 'taskAttemptId',
      name: 'Task Attempt Id',
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
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: item => <StatusBadge status={capitalize(item.attemptState)} />,
    },
    {
      key: 'taskAttemptExitCode',
      name: 'Task Attempt Exit Code',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>
            {item.containerExitCode}
          </div>
        );
      },
    },
  ];
  const optionalColumns = [
    {
      key: 'startTime',
      name: 'Start Time',
      headerClassName: FontClassNames.medium,
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      onRender: item => {
        return (
          <div className={c(FontClassNames.mediumPlus)}>
            {isNil(item.createdTime)
              ? 'N/A'
              : printDateTime(DateTime.fromMillis(item.createdTime))}
          </div>
        );
      },
    },
    {
      key: 'taskAttemptCompletedTime',
      name: 'Task Attempt Completed Time',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>
            {isNil(item.createdTime)
              ? 'N/A'
              : printDateTime(DateTime.fromMillis(item.createdTime))}
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
            <div className={c(t.truncate, FontClassNames.mediumPlus)}>{id}</div>
          )
        );
      },
    },
  ];

  let columns = defaultColumns;
  if (showMoreDiagnostics) {
    columns = columns.concat(optionalColumns);
  }

  return columns;
};
