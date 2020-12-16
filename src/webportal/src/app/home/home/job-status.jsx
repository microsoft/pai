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

import c from 'classnames';
import PropTypes from 'prop-types';
import {Stack} from 'office-ui-fabric-react';
import React, {useState} from 'react';
import MyJobStatus from './my-job-status';
import FailedJobs from './failed-jobs';
import t from '../../components/tachyons.scss';

const JobStatus = ({jobs, userGroupList}) => {
  const [timeScale, setTimeScale] = useState(cookies.get('timeScale') ? cookies.get('timeScale') : 'LastTFHours');

  function getTimeScale(timeScale) {
    setTimeScale(timeScale);
  }

  return (
    <Stack horizontal horizontalAlign='space-between' styles={{root: {height: '100%'}}} tokens={{childrenGap: 10, padding: 20}}>
      <Stack className={c(t.shadow4)} styles={{root: {width: '60%'}}}>
        <MyJobStatus
          userGroupList={userGroupList}
          jobs={jobs}
          getTimeScale={getTimeScale}
        />
      </Stack>
      <Stack className={c(t.shadow4)} styles={{root: {width: '40%', minWidth: 460}}}>
        <FailedJobs
          userGroupList={userGroupList}
          jobs={jobs}
          timeScale={timeScale}
        />
      </Stack>
    </Stack>
  );
};

JobStatus.propTypes = {
  jobs: PropTypes.object.isRequired,
  userGroupList: PropTypes.object.isRequired,
};

export default JobStatus;
