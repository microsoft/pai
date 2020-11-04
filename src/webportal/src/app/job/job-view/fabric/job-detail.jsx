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

import { capitalize, isEmpty, isNil, get } from 'lodash';
import { DateTime, Interval } from 'luxon';
import {
  MessageBar,
  MessageBarType,
  Stack,
  Dropdown,
  Text,
  Toggle,
  Link,
} from 'office-ui-fabric-react';
import React from 'react';
import ReactDOM from 'react-dom';
import yaml from 'js-yaml';

import t from '../../../components/tachyons.scss';

import { getDurationString } from '../../../components/util/job';
import Context from './job-detail/components/context';
import Top from './job-detail/components/top';
import Summary from './job-detail/components/summary';
import { SpinnerLoading } from '../../../components/loading';
import {
  fetchJobConfig,
  fetchJobInfo,
  fetchSshInfo,
  stopJob,
  NotFoundError,
  fetchRawJobConfig,
} from './job-detail/conn';
import Card from './job-detail/components/card';
import HorizontalLine from '../../../components/horizontal-line';
import StatusBadge from '../../../components/status-badge';
import TaskRoleContainerList from './job-detail/components/task-role-container-list';
import TaskRoleCount from './job-detail/components/task-role-count';
import MonacoPanel from '../../../components/monaco-panel';

const params = new URLSearchParams(window.location.search);
// the user who is viewing this page
const userName = cookies.get('user');
// the user of the job
const userNameOfTheJob = params.get('username');
// is the user viewing his/her own job?
const isViewingSelf = userName === userNameOfTheJob;

class JobDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      reloading: false,
      error: null,
      // always reload
      jobInfo: null,
      // load once
      rawJobConfig: null,
      jobConfig: null,
      sshInfo: null,
      showMoreDiagnostics: false,
      selectedAttemptIndex: null,
      loadingAttempt: false,
      monacoProps: null,
      modalTitle: '',
      jobTransferInfo: null,
    };
    this.stop = this.stop.bind(this);
    this.reload = this.reload.bind(this);
    this.onChangeJobAttempt = this.onChangeJobAttempt.bind(this);
    this.onChangeShowMoreDiagnostics = this.onChangeShowMoreDiagnostics.bind(
      this,
    );
    this.showEditor = this.showEditor.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.showExitDiagnostics = this.showExitDiagnostics.bind(this);
  }

  componentDidMount() {
    this.reload(true);
  }

  async reload(alertFlag) {
    this.setState({
      reloading: true,
    });
    const { rawJobConfig, jobConfig, sshInfo } = this.state;
    const nextState = {
      loading: false,
      reloading: false,
      error: null,
    };
    const loadJobInfo = async () => {
      try {
        nextState.jobInfo = await fetchJobInfo(this.state.selectedAttemptIndex);
      } catch (err) {
        nextState.error = `fetch job status failed: ${err.message}`;
      }
    };
    const loadJobConfig = async () => {
      if (!isNil(jobConfig)) {
        return;
      }
      try {
        nextState.jobConfig = await fetchJobConfig();
      } catch (err) {
        if (err instanceof NotFoundError) {
          nextState.jobConfig = null;
        } else {
          nextState.error = `fetch job config failed: ${err.message}`;
        }
      }
    };
    const loadRawJobConfig = async () => {
      if (!isNil(rawJobConfig)) {
        return;
      }
      try {
        nextState.rawJobConfig = await fetchRawJobConfig();
      } catch (err) {
        if (err instanceof NotFoundError) {
          nextState.rawJobConfig = null;
        } else {
          nextState.error = `fetch job config failed: ${err.message}`;
        }
      }
    };
    const loadSshInfo = async () => {
      if (!isNil(sshInfo)) {
        return;
      }
      try {
        nextState.sshInfo = await fetchSshInfo();
      } catch (err) {
        if (err instanceof NotFoundError) {
          nextState.sshInfo = null;
        } else {
          nextState.error = `fetch ssh info failed: ${err.message}`;
        }
      }
    };
    await Promise.all([
      loadJobInfo(),
      loadJobConfig(),
      loadRawJobConfig(),
      loadSshInfo(),
    ]);
    if (alertFlag === true && !isNil(nextState.error)) {
      alert(nextState.error);
    }
    if (isNil(this.state.selectedAttemptIndex)) {
      nextState.selectedAttemptIndex = nextState.jobInfo.jobStatus.retries;
    }
    nextState.jobTransferInfo = this.generateTransferState(
      nextState.jobInfo.tags,
    );
    this.setState(nextState);
  }

  async stop() {
    await stopJob();
    await this.reload();
  }

  onDismiss() {
    this.setState({
      monacoProps: null,
      modalTitle: '',
    });
  }

  showEditor(title, props) {
    this.setState({
      monacoProps: props,
      modalTitle: title,
    });
  }

  showExitDiagnostics() {
    const { jobInfo } = this.state;
    const result = [];
    // trigger info
    result.push('[Exit Trigger Info]');
    result.push('');
    result.push(
      `ExitTriggerMessage: ${get(jobInfo, 'jobStatus.appExitTriggerMessage')}`,
    );
    result.push(
      `ExitTriggerTaskRole: ${get(
        jobInfo,
        'jobStatus.appExitTriggerTaskRoleName',
      )}`,
    );
    result.push(
      `ExitTriggerTaskIndex: ${get(
        jobInfo,
        'jobStatus.appExitTriggerTaskIndex',
      )}`,
    );
    const userExitCode = get(
      jobInfo,
      'jobStatus.appExitMessages.runtime.originalUserExitCode',
    );
    if (userExitCode) {
      // user exit code
      result.push(`UserExitCode: ${userExitCode}`);
    }
    result.push('');

    // exit spec
    const spec = jobInfo.jobStatus.appExitSpec;
    if (spec) {
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
    const diag = jobInfo.jobStatus.appExitDiagnostics;
    if (diag) {
      // divider
      result.push(Array.from({ length: 80 }, () => '-').join(''));
      result.push('');
      // content
      result.push('[Exit Diagnostics]');
      result.push('');
      result.push(diag);
      result.push('');
    }

    this.showEditor('Exit Diagnostics', {
      language: 'text',
      value: result.join('\n'),
    });
  }

  onChangeJobAttempt(event, item) {
    this.setState({ loadingAttempt: true, selectedAttemptIndex: item.key });
    fetchJobInfo(item.key).then(data => {
      this.setState({
        jobInfo: data,
        loadingAttempt: false,
      });
    });
  }

  onChangeShowMoreDiagnostics(event, checked) {
    this.setState({
      showMoreDiagnostics: checked,
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

  generateTransferState(tags) {
    try {
      // find out successfully transferred beds
      const transferredPrefix = 'pai-transferred-to-';
      const transferredURLs = [];
      const transferredClusterSet = new Set();
      for (let tag of tags) {
        if (tag.startsWith(transferredPrefix)) {
          tag = tag.substr(transferredPrefix.length);
          const urlPosition = tag.lastIndexOf('-url-');
          if (urlPosition !== -1) {
            transferredClusterSet.add(tag.substr(0, urlPosition));
            transferredURLs.push(tag.substr(urlPosition + 5));
          }
        }
      }
      // find out failed transfer attempts
      const transferAttemptPrefix = 'pai-transfer-attempt-to-';
      const transferFailedClusters = [];
      for (const tag of tags) {
        if (tag.startsWith(transferAttemptPrefix)) {
          const cluster = tag.substr(transferAttemptPrefix.length);
          if (!transferredClusterSet.has(cluster)) {
            transferFailedClusters.push(cluster);
          }
        }
      }

      return { transferredURLs, transferFailedClusters };
    } catch (err) {
      // in case there is error with the tag parsing
      console.error(err);
      return {
        transferredURLs: [],
        transferFailedClusters: [],
      };
    }
  }

  render() {
    const {
      loading,
      reloading,
      error,
      jobInfo,
      jobConfig,
      rawJobConfig,
      sshInfo,
      selectedAttemptIndex,
      loadingAttempt,
      jobTransferInfo,
    } = this.state;
    const transferredURLs = _.get(jobTransferInfo, 'transferredURLs', []);
    const transferFailedClusters = _.get(
      jobTransferInfo,
      'transferFailedClusters',
      [],
    );

    const attemptIndexOptions = [];
    if (!isNil(jobInfo)) {
      for (let index = jobInfo.jobStatus.retries; index >= 0; index -= 1) {
        if (index === jobInfo.jobStatus.retries) {
          attemptIndexOptions.push({ key: index, text: `${index}  (latest)` });
        } else {
          attemptIndexOptions.push({ key: index, text: index });
        }
      }
    }
    if (loading) {
      return <SpinnerLoading />;
    } else {
      return (
        <Context.Provider
          value={{ sshInfo, rawJobConfig, jobConfig, isViewingSelf }}
        >
          <Stack styles={{ root: { margin: '30px' } }} gap='l1'>
            <Top />
            {!isEmpty(error) && (
              <div className={t.bgWhite}>
                <MessageBar messageBarType={MessageBarType.error}>
                  {error}
                </MessageBar>
              </div>
            )}
            {isViewingSelf && transferredURLs.length > 0 && (
              <div className={t.bgWhite}>
                <MessageBar messageBarType={MessageBarType.warning}>
                  <Text variant='mediumPlus'>
                    This job has been transferred to{' '}
                    {transferredURLs
                      .map(url => (
                        <a href={url} target='_blank'>
                          {url}
                        </a>
                      ))
                      .reduce((prev, curr) => [prev, ', ', curr])}
                    .{' '}
                  </Text>
                </MessageBar>
              </div>
            )}
            {isViewingSelf && transferFailedClusters.length > 0 && (
              <div className={t.bgWhite}>
                <MessageBar messageBarType={MessageBarType.warning}>
                  <Text variant='mediumPlus'>
                    You have transfer attempts to cluster{' '}
                    {transferFailedClusters.reduce((prev, curr) => [
                      prev,
                      ', ',
                      curr,
                    ])}
                    . Please go to{' '}
                    {transferFailedClusters.length > 1
                      ? 'these clusters'
                      : 'the cluster'}{' '}
                    to check whether the transfer is successful.
                  </Text>
                </MessageBar>
              </div>
            )}
            <Summary
              className={t.mt3}
              jobInfo={jobInfo}
              reloading={reloading}
              onStopJob={this.stop}
              onReload={this.reload}
              showEditor={this.showEditor}
            />
            <Card>
              <Stack gap='m' padding='l2'>
                <Stack horizontal gap='m' verticalAlign='center'>
                  <Text>Job Attempt Index</Text>
                  <Dropdown
                    styles={{ root: { width: '150px' } }}
                    placeholder='Select Attempt Index'
                    options={attemptIndexOptions}
                    selectedKey={selectedAttemptIndex}
                    onChange={this.onChangeJobAttempt}
                    disabled={loadingAttempt}
                  />
                </Stack>
                <HorizontalLine />
                {loadingAttempt ? (
                  <SpinnerLoading />
                ) : (
                  <Stack gap='l2'>
                    <Stack horizontal gap='l1'>
                      <Stack gap='m'>
                        <Text>Attempt State</Text>
                        <StatusBadge
                          status={capitalize(jobInfo.jobStatus.attemptState)}
                        />
                      </Stack>
                      <Stack gap='m'>
                        <Text>Attempt Creation Time</Text>
                        <Text>
                          {isNil(jobInfo.jobStatus.appCreatedTime)
                            ? 'N/A'
                            : DateTime.fromMillis(
                                jobInfo.jobStatus.appCreatedTime,
                              ).toLocaleString(
                                DateTime.DATETIME_MED_WITH_SECONDS,
                              )}
                        </Text>
                      </Stack>
                      <Stack gap='m'>
                        <Text>Attempt Duration</Text>
                        <Text>
                          {getDurationString(
                            this.getTimeDuration(
                              jobInfo.jobStatus.appCreatedTime,
                              jobInfo.jobStatus.appCompletedTime,
                            ),
                          )}
                        </Text>
                      </Stack>
                      <Stack gap='m'>
                        <Text>Attempt Running Start Time</Text>
                        <Text>
                          {isNil(jobInfo.jobStatus.appLaunchedTime)
                            ? 'N/A'
                            : DateTime.fromMillis(
                                jobInfo.jobStatus.appLaunchedTime,
                              ).toLocaleString(
                                DateTime.DATETIME_MED_WITH_SECONDS,
                              )}
                        </Text>
                      </Stack>
                      <Stack gap='m'>
                        <Text>Attempt Running Duration</Text>
                        <Text>
                          {getDurationString(
                            this.getTimeDuration(
                              jobInfo.jobStatus.appLaunchedTime,
                              jobInfo.jobStatus.appCompletedTime,
                            ),
                          )}
                        </Text>
                      </Stack>
                    </Stack>
                    <Stack horizontal horizontalAlign='space-between'>
                      <Link
                        href='#'
                        disabled={
                          isNil(jobInfo.jobStatus.appExitDiagnostics) &&
                          isNil(jobInfo.jobStatus.appExitSpec)
                        }
                        onClick={this.showExitDiagnostics}
                      >
                        View Exit Diagnostics
                      </Link>
                      <Toggle
                        onText='More Diagnostics'
                        offText='More Diagnostics'
                        onChange={this.onChangeShowMoreDiagnostics}
                        checked={this.state.showMoreDiagnostics}
                      />
                    </Stack>
                    {!isEmpty(jobInfo.taskRoles) &&
                      Object.keys(jobInfo.taskRoles).map(name => (
                        <Stack key={name} gap='m'>
                          <HorizontalLine />
                          <Stack horizontal gap='l1'>
                            <Text>{`Task Role:  ${name}`}</Text>
                            <TaskRoleCount taskInfo={jobInfo.taskRoles[name]} />
                          </Stack>
                          <TaskRoleContainerList
                            taskRoleName={name}
                            tasks={jobInfo.taskRoles[name].taskStatuses}
                            showMoreDiagnostics={this.state.showMoreDiagnostics}
                            jobAttemptIndex={this.state.selectedAttemptIndex}
                          />
                        </Stack>
                      ))}
                  </Stack>
                )}
              </Stack>
              {/* Monaco Editor Modal */}
              <MonacoPanel
                isOpen={!isNil(this.state.monacoProps)}
                onDismiss={this.onDismiss}
                title={this.state.modalTitle}
                monacoProps={this.state.monacoProps}
              />
            </Card>
          </Stack>
        </Context.Provider>
      );
    }
  }
}

ReactDOM.render(<JobDetail />, document.getElementById('content-wrapper'));
