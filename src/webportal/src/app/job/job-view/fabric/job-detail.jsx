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

import classNames from 'classnames';
import { capitalize, get, isEmpty, isNil } from 'lodash';
import { DateTime } from 'luxon';
import {
  FontClassNames,
  MessageBar,
  MessageBarType,
  Stack,
  DetailsList,
  DefaultButton,
  TooltipHost,
  DirectionalHint,
  Dropdown,
  Text,
  Toggle,
} from 'office-ui-fabric-react';
import React from 'react';
import ReactDOM from 'react-dom';

import t from '../../../components/tachyons.scss';

import Context from './job-detail/components/context';
import Top from './job-detail/components/top';
import Summary from './job-detail/components/summary';
import { SpinnerLoading } from '../../../components/loading';
import TaskRole from './job-detail/components/task-role';
import {
  fetchJobConfig,
  fetchJobInfo,
  fetchSshInfo,
  stopJob,
  NotFoundError,
  fetchRawJobConfig,
} from './job-detail/conn';
import { getHumanizedJobStateString } from '../../../components/util/job';
import Card from './job-detail/components/card';
import StatusBadge from '../../../components/status-badge';
import { printDateTime } from './job-detail/util';
import CopyButton from '../../../components/copy-button';
import TaskRoleContainerList from './job-detail/components/task-role-container-list';

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
      selectedRetryIndex: null,
      showTaskRetryInfo: false,
    };
    this.stop = this.stop.bind(this);
    this.reload = this.reload.bind(this);
    this.onChangeRetry = this.onChangeRetry.bind(this);
    this.onChangeShowTaskRetryInfo = this.onChangeShowTaskRetryInfo.bind(this);
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
        nextState.jobInfo = await fetchJobInfo();
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
    nextState.selectedRetryIndex = nextState.jobInfo.jobStatus.retries;
    this.setState(nextState);
  }

  async stop() {
    await stopJob();
    await this.reload();
  }


  onChangeRetry(event, item) {
    fetchJobInfo(item.key, this.state.showTaskRetryInfo).then(data => {
      this.setState({
        selectedRetryIndex: item.key,
        jobInfo: data,
      });
    });
  }

  onChangeShowTaskRetryInfo(event, checked) {
    fetchJobInfo(this.state.selectedRetryIndex, checked).then(data => {
      this.setState({
        showTaskRetryInfo: checked,
        jobInfo: data,
      });
    });
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
      selectedRetryIndex,
    } = this.state;

    const retryIndexOptions = [];
    if (!isNil(jobInfo)) {
      for (let index = jobInfo.jobStatus.retries; index >= 0; index -= 1) {
        if (index === jobInfo.jobStatus.retries) {
          retryIndexOptions.push({ key: index, text: `${index}  (current)` });
        } else {
          retryIndexOptions.push({ key: index, text: index });
        }
      }
    }
    if (loading) {
      return <SpinnerLoading />;
    } else {
      return (
        <Context.Provider value={{ sshInfo, rawJobConfig, jobConfig }}>
          <Stack styles={{ root: { margin: '30px' } }} gap='l1'>
            <Top />
            {!isEmpty(error) && (
              <div className={t.bgWhite}>
                <MessageBar messageBarType={MessageBarType.error}>
                  {error}
                </MessageBar>
              </div>
            )}
            <Summary
              className={t.mt3}
              jobInfo={jobInfo}
              reloading={reloading}
              onStopJob={this.stop}
              onReload={this.reload}
            />
            <Card>
              <Stack gap='m' padding='l2'>
                <Stack
                  horizontal
                  horizontalAlign='space-between'
                  verticalAlign='baseline'
                  gap='m'
                >
                  <Stack horizontal gap='m' verticalAlign='center'>
                    <Text>Job Attempt Index</Text>
                    <Dropdown
                      styles={{ root: { width: '150px' } }}
                      placeholder='Select Retry Index'
                      options={retryIndexOptions}
                      defaultSelectedKey={selectedRetryIndex || undefined}
                      onChange={this.onChangeRetry}
                    />
                    <Stack gap='s1'>
                      <Text>Attempt State</Text>
                      <Text>{jobInfo.jobStatus.attemptState}</Text>
                    </Stack>
                    <Stack gap='s1'>
                      <Text>Attempt Start Time</Text>
                      <Text>
                        {DateTime.fromMillis(
                          jobInfo.jobStatus.createdTime,
                        ).toLocaleString(DateTime.DATETIME_MED)}
                      </Text>
                    </Stack>
                    <Stack gap='s1'>
                      <Text>Attempt Complete Time</Text>
                      <Text>
                        {DateTime.fromMillis(
                          jobInfo.jobStatus.completedTime,
                        ).toLocaleString(DateTime.DATETIME_MED)}
                      </Text>
                    </Stack>
                  </Stack>
                  <Toggle
                    onText='More Details'
                    offText='More Details'
                    onChange={this.onChangeShowTaskRetryInfo}
                  />
                </Stack>
                <TaskRoleContainerList
                  taskAttempts={jobInfo}
                  showTaskRetryInfo={this.state.showTaskRetryInfo}
                />
              </Stack>
            </Card>
          </Stack>
        </Context.Provider>
      );
    }
  }
}

ReactDOM.render(<JobDetail />, document.getElementById('content-wrapper'));
