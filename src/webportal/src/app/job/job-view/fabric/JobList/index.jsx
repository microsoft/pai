// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PAIV2 } from '@microsoft/openpai-js-sdk';
import * as querystring from 'querystring';

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { debounce, isEmpty, isNil } from 'lodash';

import { ColorClassNames, getTheme } from '@uifabric/styling';
import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import {
  MessageBar,
  MessageBarType,
} from 'office-ui-fabric-react/lib/MessageBar';
import { Stack } from 'office-ui-fabric-react/lib/Stack';

import Context from './Context';
import Filter from './Filter';
import Ordering from './Ordering';
import Pagination from './Pagination';
import Paginator from './Paginator';
import Table from './Table';
import TopBar from './TopBar';

import webportalConfig from '../../../../config/webportal.config';
import { clearToken } from '../../../../user/user-logout/user-logout.component';
import userAuth from '../../../../user/user-auth/user-auth.component';

export default function JobList() {
  const admin = userAuth.checkAdmin();
  const username = cookies.get('user');

  const [allJobs, setAllJobs] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [error, setError] = useState(null);

  const initialFilter = useMemo(() => {
    const query = querystring.parse(location.search.replace(/^\?/, ''));
    if (['vcName', 'status', 'user'].some(x => !isEmpty(query[x]))) {
      const queryFilter = new Filter();
      if (query.vcName) {
        queryFilter.virtualClusters = new Set([query.vcName]);
      }
      if (query.status) {
        queryFilter.statuses = new Set([query.status]);
      }
      if (query.user) {
        queryFilter.users = new Set([query.user]);
      }
      return queryFilter;
    } else {
      const initialFilterUsers =
        username && !admin ? new Set([username]) : undefined;
      const filter = new Filter(undefined, initialFilterUsers);
      filter.load();
      return filter;
    }
  });
  const [filter, setFilter] = useState(initialFilter);
  const [ordering, setOrdering] = useState(new Ordering());
  const [pagination, setPagination] = useState(new Pagination());
  const [filteredJobs, setFilteredJobs] = useState(null);

  useEffect(() => filter.save(), [filter]);

  const { current: applyFilter } = useRef(
    debounce((allJobs, /** @type {Filter} */ filter) => {
      if (isNil(allJobs)) {
        setFilteredJobs(null);
      } else {
        setFilteredJobs(filter.apply(allJobs));
      }
    }, 200),
  );

  useEffect(() => {
    applyFilter(allJobs, filter);
  }, [applyFilter, allJobs, filter]);

  useEffect(() => {
    setPagination(new Pagination(pagination.itemsPerPage, 0));
  }, [filteredJobs]);

  const stopJob = useCallback(
    (...jobs) => {
      userAuth.checkToken(token => {
        jobs.forEach(job => {
          const { name, username } = job;
          const client = new PAIV2.OpenPAIClient({
            rest_server_uri: new URL(
              webportalConfig.restServerUri,
              window.location.href,
            ),
            username: username,
            token: token,
            https: window.location.protocol === 'https:',
          });
          client.job
            .updateJobExecutionType(username, name, 'STOP')
            .then(() => {
              job.executionType = 'STOP';
              delete job._statusText;
              delete job._statusIndex;
              setAllJobs(allJobs.slice());
            })
            .catch(err => {
              if (err.data.code === 'UnauthorizedUserError') {
                alert(err.data.message);
                clearToken();
              } else {
                throw new Error(err.data.message);
              }
            });
        });
      });
    },
    [allJobs],
  );

  const refreshJobs = useCallback(function refreshJobs() {
    setAllJobs(null);
    const token = userAuth.checkToken();
    const client = new PAIV2.OpenPAIClient({
      rest_server_uri: new URL(
        webportalConfig.restServerUri,
        window.location.href,
      ),
      username: username,
      token: token,
      https: window.location.protocol === 'https:',
    });
    client.job
      .listJobs()
      .then(data => {
        return data;
      })
      .then(setAllJobs)
      .catch(err => {
        throw Error(err.data.message || err.message);
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
}
