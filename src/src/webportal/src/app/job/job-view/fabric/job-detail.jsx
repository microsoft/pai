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
import {get, isEmpty} from 'lodash';
import {initializeIcons, FontClassNames, MessageBar, MessageBarType} from 'office-ui-fabric-react';
import React from 'react';
import ReactDOM from 'react-dom';

import t from '../../../components/tachyons.scss';

import Top from './job-detail/components/top';
import Summary from './job-detail/components/summary';
import {SpinnerLoading} from '../../../components/loading';
import TaskRole from './job-detail/components/task-role';
import {fetchJobConfig, fetchJobInfo, fetchSshInfo, stopJob, NotFoundError} from './job-detail/conn';
import {getHumanizedJobStateString, getTaskConfig, isJobV2} from './job-detail/util';

initializeIcons();

class JobDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jobInfo: null,
      jobConfig: null,
      loading: true,
      reloading: false,
      sshInfo: null,
      error: null,
    };
    this.stop = this.stop.bind(this);
    this.reload = this.reload.bind(this);
  }

  componentDidMount() {
    void this.reload(true);
  }

  async reload(alert) {
    this.setState({
      reloading: true,
    });
    await Promise.all([
      fetchJobInfo().catch((err) => {
        throw new Error(`fetch job status failed: ${err.message}`);
      }),
      fetchJobConfig().catch((err) => {
        if (err instanceof NotFoundError) {
          return null;
        } else {
          throw new Error(`fetch job config failed: ${err.message}`);
        }
      }),
      fetchSshInfo().catch((err) => {
        if (err instanceof NotFoundError) {
          return null;
        } else {
          throw new Error(`fetch ssh info failed: ${err.message}`);
        }
      }),
    ]).then(([jobInfo, jobConfig, sshInfo]) => {
      this.setState({
        loading: false,
        reloading: false,
        jobInfo: jobInfo,
        jobConfig: jobConfig,
        sshInfo: sshInfo,
        error: null,
      });
    }).catch((err) => {
      if (alert === true) {
        alert(err);
      } else {
        this.setState({error: err.message});
      }
    });
  }

  async stop() {
    await stopJob();
    await this.reload();
  }

  renderTaskRoles() {
    const {jobConfig, jobInfo, sshInfo} = this.state;
    if (!isEmpty(jobInfo.taskRoles)) {
      const failedTaskRole = getHumanizedJobStateString(jobInfo) === 'Failed' && get(jobInfo, 'jobStatus.appExitTriggerTaskRoleName');
      return Object.keys(jobInfo.taskRoles).map((key) => (
        <TaskRole
          key={key}
          taskInfo={jobInfo.taskRoles[key]}
          jobStatus={getHumanizedJobStateString(jobInfo)}
          sshInfo={sshInfo}
          taskConfig={getTaskConfig(jobConfig, key)}
          isFailed={failedTaskRole && key === failedTaskRole}
        />
      ));
    } else if (jobConfig && jobConfig.taskRoles) {
      // render mock task roles
      if (isJobV2(jobConfig)) {
        return Object.keys(jobConfig.taskRoles).map((key) => (
          <TaskRole
            key={key}
            jobStatus='Waiting'
            sshInfo={sshInfo}
            taskConfig={jobConfig[key]}
          />
        ));
      } else {
        return jobConfig.taskRoles.map((config) => (
          <TaskRole
            key={config.name}
            jobStatus='Waiting'
            sshInfo={sshInfo}
            taskConfig={config}
          />
        ));
      }
    } else {
      return null;
    }
  }

  render() {
    const {loading, jobConfig, jobInfo, reloading, error} = this.state;
    if (loading) {
      return <SpinnerLoading />;
    } else {
      return (
        <div className={classNames(t.w100, t.ph4, t.pv3, FontClassNames.medium)}>
          <Top />
          {!isEmpty(error) && (
            <div className={t.bgWhite}>
              <MessageBar messageBarType={MessageBarType.error}>
                {error}
              </MessageBar>
            </div>
          )}
          <Summary
            jobInfo={jobInfo}
            jobConfig={jobConfig}
            reloading={reloading}
            onStopJob={this.stop}
            onReload={this.reload}
          />
          {this.renderTaskRoles()}
        </div>
      );
    }
  }
}

ReactDOM.render(<JobDetail />, document.getElementById('content-wrapper'));

document.getElementById('sidebar-menu--job-view').classList.add('active');
