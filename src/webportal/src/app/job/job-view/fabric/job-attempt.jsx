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
import { initializeIcons, FontClassNames } from 'office-ui-fabric-react';
import React from 'react';
import ReactDOM from 'react-dom';

import t from '../../../components/tachyons.scss';

import Context from './job-detail/components/context';
import Top from './job-detail/components/top';
import Summary from './job-detail/components/summary';
import { SpinnerLoading } from '../../../components/loading';
import TaskRole from './job-detail/components/task-role';
import {
  fetchJobAttemtps,
  fetchJobConfig,
  fetchJobInfo,
  fetchSshInfo,
  stopJob,
  NotFoundError,
  fetchRawJobConfig,
} from './job-detail/conn';
import { getHumanizedJobStateString } from '../../../components/util/job';

initializeIcons();

class JobAttempt extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      jobAttempts: null,
      error: null,
    };
    this.reload = this.reload.bind(this);
  }

  componentDidMount() {
    this.reload(true);
  }

  async reload(alertFlag) {
    const nextState = {
      loading: false,
    };
    const loadJobInfo = async () => {
      try {
        const result = await fetchJobAttemtps();
        if (result.isSucceeded) {
          nextState.jobAttempts = result.jobAttempts;
        } else {
          nextState.error = result.errorMessage;
        }
      } catch (err) {
        nextState.error = `fetch job status failed: ${err.message}`;
      }
    };
    await loadJobInfo();
    if (alertFlag === true && !isNil(nextState.error)) {
      alert(nextState.error);
    }
    this.setState(nextState);
  }

  renderAttempt(jobAttempt) {
    if (!isEmpty(jobAttempt.taskRoles)) {
      return Object.keys(jobAttempt.taskRoles).map(name => (
        <TaskRole
          key={name}
          className={t.mt3}
          name={name}
          taskInfo={jobInfo.taskRoles[name]}
          isFailed={failedTaskRole && name === failedTaskRole}
        />
      ));
    } else {
      return null;
    }
  }

  render() {
    const { loading, jobAttempts } = this.state;
    if (loading) {
      return <SpinnerLoading />;
    } else {
      return (
        <div className={classNames(t.w100, t.pa4, FontClassNames.medium)}>
          <Top />
          {jobAttempts.map(jobAttempt => {
            this.renderAttempt(jobAttempt);
          })}
        </div>
      );
    }
  }
}

ReactDOM.render(<JobAttempt />, document.getElementById('content-wrapper'));

document.getElementById('sidebar-menu--job-view').classList.add('active');
