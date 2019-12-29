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

import * as querystring from 'querystring';

import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ColorClassNames, getTheme } from '@uifabric/styling';
import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import {
  MessageBar,
  MessageBarType,
} from 'office-ui-fabric-react/lib/MessageBar';
import { Stack } from 'office-ui-fabric-react/lib/Stack';

import Context from './Context';
import Filter from './Filter';
import Pagination from './Pagination';
import Paginator from './components/Paginator';
import Table from './components/Table';
import TopBar from './components/top-bar';

import webportalConfig from '../../config/webportal.config';
import FilterBar from './components/filter-bar';

const SuccessJobList = () => {
  const username = 'binyli';
  const [successJobs, setSuccessJobs] = useState(null);
  const [error, setError] = useState(null);
  const [currentJobConfig, setCurrentJobConfig] = useState(null);

  const [filteredJobs, setfilteredJobs] = useState(null);
  const [filter, setFilter] = useState(new Filter());
  const [pagination, setPagination] = useState(new Pagination());

  useEffect(() => {
    setfilteredJobs(filter.apply(successJobs));
  }, [successJobs, filter]);

  const refreshSuccessJobs = useCallback(function refreshJobs() {
    setSuccessJobs(null);
    fetch(
      `${webportalConfig.restServerUri}/api/v1/jobs?${querystring.stringify({
        username,
      })}`,
    )
      .then(response => {
        if (!response.ok) {
          throw Error(response.message);
        } else {
          return response.json();
        }
      })
      .then(allJobs => {
        const successJobs = allJobs.filter(job => job.state === 'SUCCEEDED');
        setSuccessJobs(successJobs);
      })
      .catch(reason => {
        setError(reason.message);
      });
  }, []);

  useEffect(refreshSuccessJobs, []);

  const context = {
    successJobs,
    filteredJobs,
    filter,
    setFilter,
    pagination,
    setPagination,
    currentJobConfig,
    setCurrentJobConfig,
  };

  const { spacing } = getTheme();

  return (
    <Context.Provider value={context}>
      <Fabric style={{ height: '100%' }}>
        {error && (
          <div className={ColorClassNames.whiteBackground}>
            <MessageBar
              messageBarType={MessageBarType.blocked}
              onDismiss={() => setError(null)}
              dismissButtonAriaLabel='Close'
            >
              {error}
            </MessageBar>
          </div>
        )}
        <Stack
          verticalFill
          styles={{
            root: {
              position: 'relative',
              padding: `${spacing.s1} ${spacing.l1} ${spacing.l1}`,
            },
          }}
        >
          <Stack.Item>
            <TopBar />
          </Stack.Item>
          <Stack.Item>
            <div style={{ height: spacing.s1 }}></div>
          </Stack.Item>
          <Stack.Item>
            <FilterBar />
          </Stack.Item>
          <Stack.Item
            grow
            styles={{
              root: {
                height: 0,
                overflow: 'auto',
                backgroundColor: 'white',
                padding: spacing.l1,
              },
            }}
          >
            <Table />
          </Stack.Item>
          <Stack.Item
            styles={{
              root: { backgroundColor: 'white', paddingBottom: spacing.l1 },
            }}
          >
            <Paginator />
          </Stack.Item>
        </Stack>
      </Fabric>
    </Context.Provider>
  );
};

const contentWrapper = document.getElementById('content-wrapper');
ReactDOM.render(<SuccessJobList />, contentWrapper);
