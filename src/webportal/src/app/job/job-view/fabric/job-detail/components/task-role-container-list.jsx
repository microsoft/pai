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
import {createTheme, FontClassNames} from '@uifabric/styling';
import c from 'classnames';
import {isNil} from 'lodash';
import {CommandBarButton} from 'office-ui-fabric-react/lib/Button';
import {DetailsList, SelectionMode, DetailsRow, DetailsListLayoutMode} from 'office-ui-fabric-react/lib/DetailsList';
import PropTypes from 'prop-types';
import React from 'react';

import localCss from './task-role-container-list.scss';
import t from '../../tachyons.css';

import MonacoModal from './monaco-modal';
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
      monacoModalTitle: '',
      logUrl: null,
      type: '',
    };

    this.showSshInfo = this.showSshInfo.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.showContainerLog = this.showContainerLog.bind(this);
    this.onRenderRow = this.onRenderRow.bind(this);
    this.logAutoRefresh = this.logAutoRefresh.bind(this);
    this.timer = null;
  }

  componentDidMount() {
    this.startTimer();
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  logAutoRefresh() {
    const {logUrl, type} = this.state;
    if (logUrl === null) {
      this.stopTimer();
    } else {
      void getContainerLog(logUrl, type).then((res) => {
        const {logUrl: currentLogUrl} = this.state;
        if (logUrl === currentLogUrl) {
          this.setState({monacoProps: {value: res}});
        }
      }).catch((err) => {
        const {logUrl: currentLogUrl} = this.state;
        if (logUrl === currentLogUrl) {
          this.setState({monacoProps: {value: err.message}});
        }
      });
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(this.logAutoRefresh, interval);
  }

  stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onDismiss() {
    this.stopTimer();
    this.setState({
      monacoProps: null,
      monacoModalTitle: '',
      logUrl: null,
      type: '',
    });
  }

  showContainerLog(logUrl, type, title) {
    this.setState({
      monacoProps: {value: 'Loading...'},
      monacoModalTitle: (
        <div className={c(t.flex, t.justifyBetween)}>
          <div>
            {title}
          </div>
          <a
            href={`${logUrl}${type}`}
            target='_blank'
            rel='noopener noreferrer'
            className={c(localCss.fullLogLink, t.mr3)}
          >
            View Full Log
          </a>
        </div>
      ),
      logUrl,
      type,
    }, () => {
      this.logAutoRefresh(); // start immediately
      this.startTimer();
    });
  }

  showSshInfo(id) {
    const {sshInfo} = this.props;
    const containerSshInfo = sshInfo && sshInfo.containers.find((x) => x.id === id);
    if (!containerSshInfo) {
      this.setState({
        monacoProps: {value: 'This job does not contain SSH info.'},
        monacoModalTitle: `SSH to ${id}`,
      });
    } else {
      const res = [];
      res.push('# Step 1. Open a Bash shell terminal.');
      res.push('# Step 2: Download the private key:');
      res.push(`wget ${sshInfo.keyPair.privateKeyDirectDownloadLink} -O ${sshInfo.keyPair.privateKeyFileName}`);
      res.push('# Step 3: Set correct permission for the key file:');
      res.push(`chmod 600 ${sshInfo.keyPair.privateKeyFileName}`);
      res.push('# Step 4: Connect to the container:');
      res.push(`ssh -i ${sshInfo.keyPair.privateKeyFileName} -p ${containerSshInfo.sshPort} ${containerSshInfo.sshIp}`);
      res.push('');
      this.setState({
        monacoProps: {
          value: res.join('\n'),
          options: {
            wordWrap: 'off',
            readOnly: true,
          },
        },
        monacoModalTitle: `SSH to ${id}`,
      });
    }
  }

  getColumns() {
    const {taskInfo, jobStatus} = this.props;
    const mleFlag = taskInfo.taskStatuses.some((item) => item.containerExitCode === 200 || item.containerExitCode === 201);
    const columns = [
      {
        key: 'name',
        name: 'Container ID',
        minWidth: 100,
        maxWidth: 500,
        isResizable: true,
        onRender: (item) => {
          const id = item.containerId;
          return !isNil(id) && (
            <div className={t.truncate}>
              {id}
            </div>
          );
        },
      },
      {
        key: 'ip',
        name: 'IP',
        minWidth: 80,
        maxWidth: 120,
        isResizable: true,
        fieldName: 'containerIp',
      },
      {
        key: 'ports',
        name: 'Ports',
        minWidth: 120,
        maxWidth: 160,
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
        minWidth: 60,
        maxWidth: 100,
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
      /* TODO: wait for rest api
      {
        key: 'status',
        name: 'Status',
        onRender: (item) => {}
      },
      */
      {
        key: 'exitCode',
        name: 'Exit Code',
        minWidth: mleFlag ? 160 : 50,
        maxWidth: mleFlag ? 200 : 80,
        isResizable: true,
        onRender: (item) => {
          const code = item.containerExitCode;
          if (code === 200 || code === 201) {
            return (
              <div>
                <span>{code}</span>
                <span className={t.ml2}>(Memory Limit Exceeded)</span>
              </div>
            );
          } else if (!isNil(code)) {
            return <div>{code}</div>;
          }
        },
      },
      {
        key: 'action',
        name: 'Actions',
        className: localCss.pa0I,
        minWidth: 300,
        maxWidth: 340,
        onRender: (item) => (
          <div className={c(t.flex, t.h3)}>
            <CommandBarButton
              className={c(FontClassNames.small)}
              styles={{
                root: {backgroundColor: 'transparent'},
                rootDisabled: {backgroundColor: 'transparent'},
              }}
              iconProps={{iconName: 'CommandPrompt'}}
              text='View SSH Info'
              onClick={() => this.showSshInfo(item.containerId)}
              disabled={jobStatus !== 'Running'}
            />
            <CommandBarButton
              className={FontClassNames.small}
              styles={{root: {backgroundColor: 'transparent'}}}
              iconProps={{iconName: 'TextDocument'}}
              text='Stdout'
              onClick={() => this.showContainerLog(item.containerLog, 'stdout', 'Standard Output (Last 4096 bytes)')}
            />
            <CommandBarButton
              className={FontClassNames.small}
              styles={{
                root: {backgroundColor: 'transparent'},
              }}
              iconProps={{iconName: 'Error'}}
              text='Stderr'
              onClick={() => this.showContainerLog(item.containerLog, 'stderr', 'Standard Error (Last 4096 bytes)')}
            />
            <CommandBarButton
              className={FontClassNames.small}
              styles={{
                root: {backgroundColor: 'transparent'},
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
    const {monacoModalTitle, monacoProps} = this.state;
    const {className, style, taskInfo} = this.props;
    return (
      <div className={className} style={{backgroundColor: theme.palette.white, ...style}}>
        <ThemeProvider theme={theme}>
          <DetailsList
            columns={this.getColumns()}
            disableSelectionZone
            items={taskInfo.taskStatuses}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            onRenderRow={this.onRenderRow}
          />
        </ThemeProvider>
        {/* Monaco Editor Modal */}
        <MonacoModal
          isOpen={!isNil(monacoProps)}
          onDismiss={this.onDismiss}
          title={monacoModalTitle}
          monacoProps={monacoProps}
        />
      </div>
    );
  }
}

TaskRoleContainerList.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  taskInfo: PropTypes.object.isRequired,
  jobStatus: PropTypes.string.isRequired,
  sshInfo: PropTypes.object,
};
