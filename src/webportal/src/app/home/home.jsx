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

import c from 'classnames';
import {isEmpty} from 'lodash';
import {initializeIcons, Stack, getTheme} from 'office-ui-fabric-react';
import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

import JobStatus from './home/job-status';
import VirtualClusterList from './home/virtual-cluster-list';
import VirtualClusterStatistics from './home/virtual-cluster-statistics';
import GpuChart from './home/gpu-chart';
import {listJobs, getUserInfo, listVirtualClusters, getAvailableGpuPerNode, UnauthorizedError, listAllJobs} from './home/conn';
import RecentJobList from './home/recent-job-list';
import AbnormalJobList from './home/abnormal-job-list';
import {BREAKPOINT1} from './home/util';
import {SpinnerLoading} from '../components/loading';
import {initTheme} from '../components/theme';
import {userLogout} from '../user/user-logout/user-logout.component.js';

import t from '../components/tachyons.scss';

initTheme();
initializeIcons();

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [virtualClusters, setVirtualClusters] = useState(null);
  const [gpuPerNode, setGpuPerNode] = useState(null);
  const isAdmin = cookies.get('admin') === 'true';

  useEffect(() => {
    if (!isEmpty(cookies.get('user'))) {
      Promise.all([
        isAdmin ? listAllJobs().then(setJobs) : listJobs().then(setJobs),
        getUserInfo().then(setUserInfo),
        listVirtualClusters().then(setVirtualClusters),
        getAvailableGpuPerNode().then(setGpuPerNode),
      ]).then(() => {
        setLoading(false);
      }).catch((err) => {
        if (err instanceof UnauthorizedError) {
          alert(err);
          userLogout();
        } else {
          alert(err);
        }
      });
    } else {
      // layout.component.js will redirect user to index page.
    }
  }, []);

  if (loading) {
    return <SpinnerLoading />;
  } else {
    const {spacing} = getTheme();

    const ResponsiveFlexBox = styled.div`
      @media screen and (min-width: ${BREAKPOINT1}px) {
        display:flex;
      }
    `;

    const ResponsiveGap = styled.div`
      height: 0;
      width: ${spacing.l2};
      @media screen and (max-width: ${BREAKPOINT1}px) {
        height: ${spacing.l2};
        width: 0;
      }
    `;

    const ResponsiveItem = styled.div`
      width: 33%;
      height: auto;
      @media screen and (max-width: ${BREAKPOINT1}px) {
        width: 100%;
        height: 320px;
      }
    `;

    const ResponsiveWidthItem = styled.div`
    width: 66%;
    height: auto;
    @media screen and (max-width: ${BREAKPOINT1}px) {
      width: 100%;
      height: 320px;
    }
  `;

    return (
      <Stack
        styles={{root: [t.w100, t.h100L, {minWidth: 500}]}}
        padding="l2"
        gap="l2"
      >
        {/* top */}
        <Stack.Item>
          <ResponsiveFlexBox>
            <ResponsiveItem>
              <JobStatus style={{height: '100%'}} jobs={jobs} />
            </ResponsiveItem>
            <ResponsiveGap />
            {isAdmin ? (
              <ResponsiveWidthItem>
                <VirtualClusterStatistics
                  style={{height: '100%'}}
                  userInfo={userInfo}
                  virtualClusters={virtualClusters}
                />
              </ResponsiveWidthItem>
            ) : (
              <React.Fragment>
                <ResponsiveItem>
                  <VirtualClusterList
                    style={{height: '100%'}}
                    userInfo={userInfo}
                    virtualClusters={virtualClusters}
                  />
                </ResponsiveItem>
                <ResponsiveGap />
                <ResponsiveItem>
                <GpuChart
                  style={{height: '100%'}}
                  gpuPerNode={gpuPerNode}
                  userInfo={userInfo}
                  virtualClusters={virtualClusters}
                />
                </ResponsiveItem>
              </React.Fragment>
            )}
          </ResponsiveFlexBox>
        </Stack.Item>
        {/* recent jobs */}
        <Stack.Item styles={{root: [{flexBasis: 0}]}} grow>
          {isAdmin ? (
            <AbnormalJobList className={c(t.h100)} jobs={jobs} />
          ) : (
            <RecentJobList className={c(t.h100)} jobs={jobs} />
          )}
        </Stack.Item>
      </Stack>
    );
  }
};

const contentWrapper = document.getElementById('content-wrapper');

ReactDOM.render(<Home />, contentWrapper);

document.getElementById('sidebar-menu--home').classList.add('active');
