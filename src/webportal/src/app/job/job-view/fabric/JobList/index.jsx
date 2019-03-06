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

import React, {useState, useMemo, useCallback, useEffect} from 'react';

import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {Overlay} from 'office-ui-fabric-react/lib/Overlay';
import {Stack} from 'office-ui-fabric-react/lib/Stack';

import Context from './Context';
import Filter from './Filter';
import Filters from './Filters';
import Ordering from './Ordering';
import Pagination from './Pagination';
import Paginator from './Paginator';
import Table from './Table';

import webportalConfig from '../../../../config/webportal.config';
import userAuth from '../../../../user/user-auth/user-auth.component';

initializeIcons();

function getError(error) {
  return (
    <Overlay>
      <MessageBar messageBarType={MessageBarType.blocked}>
        {error}
      </MessageBar>
    </Overlay>
  );
}

export default function JobList() {
  const [allJobs, setAllJobs] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(new Filter());
  const [ordering, setOrdering] = useState(new Ordering());
  const [pagination, setPagination] = useState(new Pagination());

  const filteredJobs = useMemo(() => {
    return allJobs !== null ? filter.apply(allJobs || []) : null;
  }, [allJobs, filter]);

  const setFilterAndResetPagination = useCallback((filter) => {
    setFilter(filter);
    setPagination(new Pagination(pagination.itemsPerPage, 0));
  }, [setFilter, setPagination, pagination]);

  const stopJob = useCallback((job) => {
    const {name, username} = job;
    userAuth.checkToken((token) => {
      fetch(`${webportalConfig.restServerUri}/api/v1/user/${username}/jobs/${name}/executionType`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({value: 'STOP'}),
      }).then((response) => {
        if (response.ok) {
          job.executionType = 'STOPPING';
          delete job._statusText;
          delete job._statusIndex;
          setAllJobs(allJobs.slice());
        } else {
          return response.json().then((data) => {
            throw Error(data.message);
          });
        }
      }).catch((reason) => {
        setError(reason.message);
        setTimeout(setError, 1000, null);
      });
    });
  }, [allJobs]);

  useEffect(function loadJobs() {
    fetch(`${webportalConfig.restServerUri}/api/v1/jobs`)
      .then((response) => {
        if (!response.ok) {
          throw Error(response.message);
        } else {
          return response.json();
        }
      })
      .then(setAllJobs)
      .catch((reason) => {
        setError(reason.message);
        setTimeout(setError, 1000, null);
      });
  }, []);

  const context = {allJobs, filteredJobs, stopJob, filter, setFilter, ordering, setOrdering, pagination, setPagination};
  context.setFilter = setFilterAndResetPagination;

  return (
    <Context.Provider value={context}>
      <Fabric style={{height: '100%'}}>
        <Stack padding={20} verticalFill styles={{root: {position: 'relative'}}}>
          <Stack.Item>
            <Filters/>
          </Stack.Item>
          <Stack.Item grow styles={{root: {height: 1, overflow: 'auto'}}}>
            <Table/>
          </Stack.Item>
          <Stack.Item>
            <Paginator/>
          </Stack.Item>
          {error !== null ? getError(error) : null}
        </Stack>
      </Fabric>
    </Context.Provider>
  );
}
