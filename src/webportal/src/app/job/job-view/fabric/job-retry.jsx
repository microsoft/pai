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

import { isNil } from 'lodash';
import {
  initializeIcons,
  Fabric,
  Stack,
  getTheme,
} from 'office-ui-fabric-react';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import Top from './job-retry/top';
import { SpinnerLoading } from '../../../components/loading';
import { JobRetryCard } from './job-retry/job-retry-card';
import { fetchJobRetries } from './job-detail/conn';

initializeIcons();
const { spacing } = getTheme();

const JobRetryPage = () => {
  const [loading, setLoading] = useState(true);
  const [jobRetries, setJobRetries] = useState(null);

  useEffect(() => {
    reload(true);
  }, []);

  const reload = async alertFlag => {
    let errorMessage;
    try {
      const result = await fetchJobRetries();
      if (result.isSucceeded) {
        setJobRetries(result.jobRetries);
      } else {
        errorMessage = result.errorMessage;
      }
    } catch (err) {
      errorMessage = `fetch job status failed: ${err.message}`;
    }
    if (alertFlag === true && !isNil(errorMessage)) {
      alert(errorMessage);
    }
    setLoading(false);
  };

  return (
    <Fabric
      style={{
        height: '100%',
        margin: `${spacing.l1} auto`,
        maxWidth: 1200,
      }}
    >
      {loading && <SpinnerLoading />}
      {!loading && (
        <Stack gap='m'>
          <Top />
          <Stack gap='l1'>
            {jobRetries.map(jobRetry => {
              return (
                <JobRetryCard key={jobRetry.attemptIndex} jobRetry={jobRetry} />
              );
            })}
          </Stack>
        </Stack>
      )}
    </Fabric>
  );
};

ReactDOM.render(<JobRetryPage />, document.getElementById('content-wrapper'));

document.getElementById('sidebar-menu--job-view').classList.add('active');
