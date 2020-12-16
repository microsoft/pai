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
import {debounce, isEmpty, isNil} from 'lodash';

import {ColorClassNames, getTheme} from '@uifabric/styling';
import {initializeIcons} from 'office-ui-fabric-react/lib/Icons';
import {Fabric} from 'office-ui-fabric-react/lib/Fabric';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {Overlay} from 'office-ui-fabric-react/lib/Overlay';
import {Stack} from 'office-ui-fabric-react/lib/Stack';

import Context from './Context';
import Filter from './Filter';
import Ordering from './Ordering';
import Pagination from './Pagination';
import SearchPaginator from './SearchPaginator';
import Table from './Table';
import TopBar from './TopBar';

import webportalConfig from '../../../../config/webportal.config';
import {checkAdmin} from '../../../../user/user-auth/user-auth.component';
import {initTheme} from '../../../../components/theme';
import {restServerClient} from '../../../../common/http-client';

initTheme();
initializeIcons();

function getError(error) {
  return (
    <Overlay>
      <div className={ColorClassNames.whiteBackground}>
        <MessageBar messageBarType={MessageBarType.blocked}>
          {error}
        </MessageBar>
      </div>
    </Overlay>
  );
}

export default function JobList() {
  const admin = checkAdmin();
  const username = cookies.get('user');

  const [allJobs, setAllJobs] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [error, setError] = useState(null); 
  
  const initialFilter = useMemo(() => {
    const query = querystring.parse(location.search.replace(/^\?/, ''));
    if (['status', 'user', 'jobType'].some((x) => !isEmpty(query[x]))) {
      const queryFilter = new Filter();
      if (query['vcName']) {
        queryFilter.virtualClusters = new Set([query['vcName']]);
      }
      if (query['status']) {
        queryFilter.statuses = new Set([query['status']]);
      }
      if (query['user']) {
        queryFilter.users = new Set([query['user']]);
      }
      if (query['jobType']) {
        queryFilter.jobType = new Set([query['jobType']]);
      }
      return queryFilter;
    } else {
      const initialFilterUsers = (username && !admin) ? new Set([username]) : undefined;
      let filter = new Filter(undefined, initialFilterUsers);
      filter.load();
      let virtualClusterUriJS = cookies.get('virtualClusterUri');
      let jobStatus = cookies.get('status');
      if (virtualClusterUriJS) {
        filter["virtualClusters"] = new Set(Array.from(JSON.parse(virtualClusterUriJS)))
      }
      if (jobStatus) {
        filter["statuses"] = new Set([...filter.statuses, ...Array.from(JSON.parse(jobStatus))])
      }
      return filter;
    }
  });
  const [filter, setFilter] = useState(initialFilter);
  const [ordering, setOrdering] = useState(new Ordering().load());
  const [pagination, setPagination] = useState(new Pagination().load());
  const [filteredJobs, setFilteredJobs] = useState(null);

  useEffect(() => filter.save(), [filter]);
  
  useEffect(() => pagination.save(), [pagination]);

  useEffect(() => ordering.save(), [ordering]);
  
  useEffect(() => {
    if (filteredJobs) {
      const isResetPageIndex = Math.ceil(filteredJobs.length / pagination.itemsPerPage) < pagination.pageIndex;
      setPagination(new Pagination(pagination.itemsPerPage, isResetPageIndex ? 0 : pagination.pageIndex));
    }
  }, [filteredJobs]);

  const {current: applyFilter} = useRef(debounce((allJobs, /** @type {Filter} */filter) => {
    if (isNil(allJobs)) {
      setFilteredJobs(null);
    } else {
      setFilteredJobs(filter.apply(allJobs));
    }
  }, 200));

  useEffect(() => {
    applyFilter(allJobs, filter);
  }, [applyFilter, allJobs, filter]);

  const stopJob = useCallback((...jobs) => {
    jobs.forEach((job) => {
      const {appId, name, jobDetailLink} = job;
      let requestUrl = jobDetailLink.includes(`?jobName=${name}`) ? `/api/v2/mp/jobs/jobName/${name}/executionType` : `/api/v2/mp/jobs/appId/${appId}/executionType`;
      restServerClient.put(requestUrl, {
        value: 'STOP',
      }).then((response) => {
        job.executionType = 'STOPPING';
        delete job._statusText;
        delete job._statusIndex;
        setAllJobs(allJobs.slice());
      }).catch((err) => {
        if (err.response) {
          let data = err.response.data;
          if (data.code === 'UnauthorizedUserError') {
            alert(data.message);
            userLogout();
          } else {
            throw new Error(data.message);
          }
        } else {
          setError(err.message);
          setTimeout(setError, 1000, null);
        }
      });
    });
  }, [allJobs]);

  const refreshJobs = useCallback(function refreshJobs() {
    setAllJobs(null);
    let jobListUri = (webportalConfig.serviceName && webportalConfig.serviceName.toLowerCase() === 'mt') ?
      `/api/v2/mp/jobs` :
      `/api/v1/jobs`;
    restServerClient.get(jobListUri).then((response) => {
      setAllJobs(response.data.mergedJobs);
    }).catch((err) => {
      if (err.response) {
        setError(err.response.data.message);
        setTimeout(setError, 1000, null);
      } else {
        setError(err.message);
        setTimeout(setError, 1000, null);
      }
    });
  }, []);

  useEffect(refreshJobs, []);

  const context = {
    allJobs,
    setAllJobs,
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

  const {spacing} = getTheme();

  return (
    <Context.Provider value={context}>
      <Fabric style={{height: '100%'}}>
        <Stack
          verticalFill
          styles={{root: {position: 'relative', padding: `${spacing.s1} ${spacing.l1} ${spacing.l1}`}}}
        >
          <Stack.Item>
            <TopBar/>
          </Stack.Item>
          <Stack.Item>
            <div style={{height: spacing.s1}}></div>
          </Stack.Item>
          <Stack.Item grow styles={{root: {height: 0, backgroundColor: 'white', padding: spacing.l1}}}>
            <Table/>
          </Stack.Item>
          <Stack.Item styles={{root: {backgroundColor: 'white', paddingBottom: spacing.l1}}}>
            <SearchPaginator Context={Context} Pagination={Pagination} />
          </Stack.Item>
          {error !== null ? getError(error) : null}
        </Stack>
      </Fabric>
    </Context.Provider>
  );
}
