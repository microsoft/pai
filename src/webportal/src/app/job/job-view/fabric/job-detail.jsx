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

import classNames from 'classnames';
import { get, isEmpty, isNil } from 'lodash';
import {
  initializeIcons,
  FontClassNames,
  MessageBar,
  MessageBarType,
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

initializeIcons();

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
    };
    this.stop = this.stop.bind(this);
    this.reload = this.reload.bind(this);
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
    this.setState(nextState);
  }

  async stop() {
    await stopJob();
    await this.reload();
  }

  renderTaskRoles() {
    const { jobConfig, jobInfo } = this.state;
    if (!isEmpty(jobInfo.taskRoles)) {
      const failedTaskRole =
        getHumanizedJobStateString(jobInfo.jobStatus) === 'Failed' &&
        get(jobInfo, 'jobStatus.appExitTriggerTaskRoleName');
      return Object.keys(jobInfo.taskRoles).map(name => (
        <TaskRole
          key={name}
          className={t.mt3}
          name={name}
          taskInfo={jobInfo.taskRoles[name]}
          isFailed={failedTaskRole && name === failedTaskRole}
        />
      ));
    } else if (jobConfig && jobConfig.taskRoles) {
      return Object.entries(jobConfig.taskRoles).map(([name, taskConfig]) => {
        // dummy tasks
        let dummyTaskInfo = null;
        if (taskConfig) {
          const instances = isNil(taskConfig.instances)
            ? 1
            : taskConfig.instances;
          dummyTaskInfo = {
            taskStatuses: Array.from({ length: instances }, (v, idx) => ({
              taskState: 'WAITING',
            })),
          };
        }

        return (
          <TaskRole
            key={name}
            name={name}
            className={t.mt3}
            taskInfo={dummyTaskInfo}
          />
        );
      });
    } else {
      return null;
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
    } = this.state;
    if (loading) {
      return <SpinnerLoading />;
    } else {
      return (
        <Context.Provider value={{ sshInfo, rawJobConfig, jobConfig }}>
          <div className={classNames(t.w100, t.pa4, FontClassNames.medium)}>
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
            {this.renderTaskRoles()}
          </div>
        </Context.Provider>
      );
    }
  }
}

ReactDOM.render(<JobDetail />, document.getElementById('content-wrapper'));

document.getElementById('sidebar-menu--job-view').classList.add('active');
