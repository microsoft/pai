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
import {createTheme, ColorClassNames, FontClassNames} from '@uifabric/styling';
import c from 'classnames';
import {capitalize, isEmpty, isNil} from 'lodash';
import {CommandBarButton, PrimaryButton} from 'office-ui-fabric-react/lib/Button';
import {DetailsList, SelectionMode, DetailsRow, DetailsListLayoutMode} from 'office-ui-fabric-react/lib/DetailsList';
import PropTypes from 'prop-types';
import React from 'react';

import localCss from './task-role-container-list.scss';
import t from '../../../../../components/tachyons.scss';

import Context from './context';
import MonacoPanel from './monaco-panel';
import StatusBadge from './status-badge';
import Timer from './timer';
import {getContainerLog} from '../conn';
import {parseGpuAttr} from '../util';

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

export default class TaskRoleContainerList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      monacoProps: null,
      monacoTitle: '',
      monacoFooterButton: null,
      logUrl: null,
    };

    this.showSshInfo = this.showSshInfo.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.showContainerLog = this.showContainerLog.bind(this);
    this.onRenderRow = this.onRenderRow.bind(this);
    this.logAutoRefresh = this.logAutoRefresh.bind(this);
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

  getColumns() {
    const columns = [
      {
        key: 'number',
        name: 'Number',
        headerClassName: FontClassNames.medium,
        minWidth: 50,
        maxWidth: 80,
        isResizable: true,
        onRender: (item, idx) => {
          return !isNil(idx) && (
            <div className={FontClassNames.mediumPlus}>
              {idx}
            </div>
          );
        },
      },
      {
        key: 'name',
        name: 'Container ID',
        headerClassName: FontClassNames.medium,
        minWidth: 100,
        maxWidth: 500,
        isResizable: true,
        onRender: (item) => {
          const id = item.containerId;
          return !isNil(id) && (
            <div className={c(t.truncate, FontClassNames.mediumPlus)}>
              {id}
            </div>
          );
        },
      },
      {
        key: 'ip',
        name: 'IP',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.medium,
        minWidth: 80,
        maxWidth: 140,
        isResizable: true,
        fieldName: 'containerIp',
      },
      {
        key: 'ports',
        name: 'Ports',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.medium,
        minWidth: 120,
        maxWidth: 180,
        isResizable: true,
        onRender: (item) => {
          const ports = item.containerPorts;
          return !isNil(ports) && (
            <div className={c(t.flex, t.itemsCenter)}>
              {
                Object.keys(ports).map((key, idx) => (
                  <div className={c(idx !== 0 && t.ml3)} key={key}>
                    <span>{`${key}:`}</span>
                    <span className={t.ml2}>{ports[key]}</span>
                  </div>
                ))
              }
            </div>
          );
        },
      },
      {
        key: 'gpus',
        name: 'GPUs',
        className: FontClassNames.mediumPlus,
        headerClassName: FontClassNames.medium,
        minWidth: 60,
        maxWidth: 120,
        isResizable: true,
        onRender: (item) => {
          const gpuAttr = item.containerGpus;
          return !isNil(gpuAttr) && (
            <div>
              {parseGpuAttr(gpuAttr).map((x) => (
                <span className={t.mr2} key={`gpu-${x}`}>{`#${x}`}</span>
              ))}
            </div>
          );
        },
      },
      {
        key: 'status',
        name: 'Status',
        headerClassName: FontClassNames.medium,
        minWidth: 100,
        maxWidth: 100,
        isResizable: true,
        onRender: (item) => <StatusBadge status={capitalize(item.taskState)}/>,
      },
      {
        key: 'info',
        name: 'Info',
        className: localCss.pa0I,
        headerClassName: FontClassNames.medium,
        minWidth: 300,
        maxWidth: 340,
        onRender: (item) => (
          <div className={c(t.flex, t.h3)}>
            <CommandBarButton
              className={c(FontClassNames.mediumPlus)}
              styles={{
                root: {backgroundColor: 'transparent'},
                rootDisabled: {backgroundColor: 'transparent'},
              }}
              iconProps={{iconName: 'CommandPrompt'}}
              text='View SSH Info'
              onClick={() => this.showSshInfo(item.containerId)}
              disabled={isNil(item.containerId) || item.taskState !== 'RUNNING'}
            />
            <CommandBarButton
              className={FontClassNames.mediumPlus}
              styles={{
                root: {backgroundColor: 'transparent'},
                rootDisabled: {backgroundColor: 'transparent'},
              }}
              iconProps={{iconName: 'TextDocument'}}
              text='Stdout'
              onClick={() => this.showContainerLog(`${item.containerLog}user.pai.stdout`, 'Standard Output (Last 4096 bytes)')}
              disabled={isNil(item.containerId)}
            />
            <CommandBarButton
              className={FontClassNames.mediumPlus}
              styles={{
                root: {backgroundColor: 'transparent'},
                rootDisabled: {backgroundColor: 'transparent'},
              }}
              iconProps={{iconName: 'Error'}}
              text='Stderr'
              onClick={() => this.showContainerLog(`${item.containerLog}user.pai.stderr`, 'Standard Error (Last 4096 bytes)')}
              disabled={isNil(item.containerId)}
            />
            <CommandBarButton
              className={FontClassNames.mediumPlus}
              styles={{
                root: {backgroundColor: 'transparent'},
                rootDisabled: {backgroundColor: 'transparent'},
              }}
              menuIconProps={{iconName: 'More'}}
              menuProps={{
                items: [
                  {
                    key: 'yarnTrackingPage',
                    name: 'Go to Yarn Tracking Page',
                    iconProps: {iconName: 'Link'},
                    href: item.containerLog,
                    target: '_blank',
                  },
                ],
              }}
              disabled={isNil(item.containerId)}
            />
          </div>
        ),
      },
    ];

    return columns;
  }

  onRenderRow(props) {
    return <DetailsRow {...props} styles={{root: {
      color: theme.palette.black,
    }}}/>;
  }

  render() {
    const {monacoTitle, monacoProps, monacoFooterButton, logUrl} = this.state;
    const {className, style, taskInfo} = this.props;
    const status = isNil(taskInfo) ? this.generateDummyTasks() : taskInfo.taskStatuses;
    return (
      <div className={className} style={{backgroundColor: theme.palette.white, ...style}}>
        <ThemeProvider theme={theme}>
          <DetailsList
            columns={this.getColumns()}
            disableSelectionZone
            items={status}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            onRenderRow={this.onRenderRow}
          />
        </ThemeProvider>
        {/* Timer */}
        <Timer interval={isNil(monacoProps) || isEmpty(logUrl) ? null : interval} func={this.logAutoRefresh} />
        {/* Monaco Editor Panel */}
        <MonacoPanel
          isOpen={!isNil(monacoProps)}
          onDismiss={this.onDismiss}
          title={monacoTitle}
          monacoProps={monacoProps}
          footerPrimaryButton={monacoFooterButton}
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
};
