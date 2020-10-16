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

import React, { useEffect, useState } from 'react';
import { Stack, ActionButton, Text } from 'office-ui-fabric-react';
import ReactDOM from 'react-dom';
import { isEmpty } from 'lodash';

import { SpinnerLoading } from '../../../components/loading';
import { fetchJobEvents } from './job-event/conn';
import JobEventList from './job-event/job-event-list';

const params = new URLSearchParams(window.location.search);
const userName = params.get('userName');
const jobName = params.get('jobName');

const JobEventPage = () => {
  const [loading, setLoading] = useState(true);
  const [jobEvents, setJobEvents] = useState([]);

  useEffect(() => {
    fetchJobEvents(userName, jobName).then(res => {
      setJobEvents(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {loading && <SpinnerLoading />}
      {!loading && (
        <Stack styles={{ root: { margin: '30px', overflow: 'auto' } }} gap='l1'>
          <ActionButton
            iconProps={{ iconName: 'revToggleKey' }}
            href={`job-detail.html?username=${userName}&jobName=${jobName}`}
          >
            Back to Job Detail
          </ActionButton>
          <Text variant='xLarge'>Job Event List</Text>
          <JobEventList jobEvents={isEmpty(jobEvents) ? null : jobEvents} />
        </Stack>
      )}
    </div>
  );
};

ReactDOM.render(<JobEventPage />, document.getElementById('content-wrapper'));
