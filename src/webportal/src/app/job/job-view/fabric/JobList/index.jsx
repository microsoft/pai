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

import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import {debounce} from 'lodash';

import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {Overlay} from 'office-ui-fabric-react/lib/Overlay';
import {Stack} from 'office-ui-fabric-react/lib/Stack';

import Context from './Context';
import Filter from './Filter';
import Ordering from './Ordering';
import Pagination from './Pagination';
import Paginator from './Paginator';
import Table from './Table';
import TopBar from './TopBar';

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
  const admin = userAuth.checkAdmin();
  const username = cookies.get('user');

  const [allJobs, setAllJobs] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [error, setError] = useState(null);

  const initialFilter = useMemo(() => {
    const initialFilterUsers = (username && !admin) ? new Set([username]) : undefined;
    let filter = new Filter(undefined, initialFilterUsers);
    filter.load();
    const query = querystring.parse(location.search.replace(/^\?/, ''));
    if (query['vcName']) {
      const {keyword, users, statuses} = filter;
      filter = new Filter(keyword, users, new Set().add(query['vcName']), statuses);
    }
    return filter;
  });
  const [filter, setFilter] = useState(initialFilter);
  const [ordering, setOrdering] = useState(new Ordering());
  const [pagination, setPagination] = useState(new Pagination());
  const [filteredJobs, setFilteredJobs] = useState(null);

  useEffect(() => filter.save(), [filter]);

  const {current: applyFilter} = useRef(debounce((allJobs, /** @type {Filter} */filter) => {
    setFilteredJobs(filter.apply(allJobs || []));
  }, 200));

  useEffect(() => {
    applyFilter(allJobs, filter);
  }, [applyFilter, allJobs, filter]);

  useEffect(() => {
    setPagination(new Pagination(pagination.itemsPerPage, 0));
  }, [filteredJobs]);

  const stopJob = useCallback((...jobs) => {
    userAuth.checkToken((token) => {
      jobs.forEach((job) => {
        const {name, username} = job;
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
    });
  }, [allJobs]);

  const refreshJobs = useCallback(function refreshJobs() {
    setAllJobs(null);
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

  useEffect(refreshJobs, []);

  const context = {
    allJobs,
    refreshJobs,
    filteredJobs,
    selectedJobs,
    setSelectedJobs,
    stopJob,
    username,
    filter,
    setFilter,
    ordering,
    setOrdering,
    pagination,
    setPagination,
  };

  return (
    <Context.Provider value={context}>
      <Fabric style={{height: '100%'}}>
        <Stack verticalFill styles={{root: {position: 'relative', padding: '0 20px 20px'}}}>
          <Stack.Item>
            <TopBar/>
          </Stack.Item>
          <Stack.Item grow styles={{root: {height: 1, overflow: 'auto', backgroundColor: 'white', paddingTop: 15}}}>
            <Table/>
          </Stack.Item>
          <Stack.Item styles={{root: {backgroundColor: 'white', paddingBottom: 15}}}>
            <Paginator/>
          </Stack.Item>
          {error !== null ? getError(error) : null}
        </Stack>
      </Fabric>
    </Context.Provider>
  );
}
