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
import { isEmpty } from 'lodash';
import { Stack, StackItem, Pivot, PivotItem } from 'office-ui-fabric-react';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import MediaQuery from 'react-responsive';

import Card from '../components/card';
import JobStatus from './home/job-status';
import { VirtualClusterStatistics } from './home/virtual-cluster-statistics';
import GpuChart from './home/gpu-chart';
import {
  listJobs,
  getUserInfo,
  listVirtualClusters,
  getAvailableGpuPerNode,
  UnauthorizedError,
  getLowGpuJobInfos,
  listAllJobs,
} from './home/conn';
import { listAbnormalJobs } from '../components/util/job';
import RecentJobList from './home/recent-job-list';
import AbnormalJobList from './home/abnormal-job-list';
import { BREAKPOINT1 } from './home/util';
import { SpinnerLoading } from '../components/loading';
import { clearToken } from '../user/user-logout/user-logout.component.js';
import { TooltipIcon } from '../job-submission/components/controls/tooltip-icon';

import t from '../components/tachyons.scss';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState(null);
  const [userJobs, setUserJobs] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [virtualClusters, setVirtualClusters] = useState(null);
  const [gpuPerNode, setGpuPerNode] = useState(null);
  const [lowGpuJobInfo, setLowGpuJobInfo] = useState(null);
  const isAdmin = cookies.get('admin') === 'true';

  useEffect(() => {
    if (!isEmpty(cookies.get('user'))) {
      if (isAdmin) {
        getLowGpuJobInfos()
          .then(setLowGpuJobInfo)
          .catch(alert);
      }
      Promise.all([
        isAdmin ? listAllJobs().then(setJobs) : listJobs().then(setJobs),
        listJobs().then(setUserJobs),
        getUserInfo().then(setUserInfo),
        listVirtualClusters().then(setVirtualClusters),
        getAvailableGpuPerNode().then(setGpuPerNode),
      ])
        .then(() => {
          setLoading(false);
        })
        .catch(err => {
          if (err instanceof UnauthorizedError) {
            alert(err);
            clearToken();
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
    return (
      <div className={c(t.w100)} style={{ minWidth: 375, overflowY: 'auto' }}>
        {/* small */}
        <MediaQuery maxWidth={BREAKPOINT1}>
          <Stack padding='l2' gap='l1' styles={{ minHeight: '100%' }}>
            <JobStatus style={{ height: 320 }} jobs={jobs} />
            <React.Fragment>
              <VirtualClusterStatistics
                style={{ height: 320 }}
                userInfo={userInfo}
                virtualClusters={virtualClusters}
              />
              <GpuChart
                style={{ height: 320 }}
                gpuPerNode={gpuPerNode}
                userInfo={userInfo}
                virtualClusters={virtualClusters}
              />
            </React.Fragment>
            <Card>
              {isAdmin ? (
                <Pivot styles={{ root: { maxHeight: '100%' } }}>
                  <PivotItem
                    headerText='Abnormal jobs'
                    onRenderItemLink={(link, defaultRenderer) => {
                      return (
                        <Stack horizontal gap='s1'>
                          {defaultRenderer(link)}
                          <TooltipIcon
                            content={
                              'A job is treaded as an abnormal job if running more than 5 days or GPU usage is lower than 10%'
                            }
                          />
                        </Stack>
                      );
                    }}
                  >
                    <AbnormalJobList
                      jobs={listAbnormalJobs(jobs, lowGpuJobInfo)}
                    />
                  </PivotItem>
                  <PivotItem headerText='My recent jobs'>
                    <RecentJobList style={{ minHeight: 0 }} jobs={userJobs} />
                  </PivotItem>
                </Pivot>
              ) : (
                <Pivot>
                  <PivotItem headerText='My recent jobs'>
                    <RecentJobList style={{ minHeight: 0 }} jobs={userJobs} />
                  </PivotItem>
                </Pivot>
              )}
            </Card>
          </Stack>
        </MediaQuery>
        {/* large */}
        <MediaQuery minWidth={BREAKPOINT1 + 1}>
          <Stack
            padding='l2'
            gap='l1'
            styles={{ root: { height: '100%', minHeight: 640 } }}
          >
            {/* top */}
            <StackItem disableShrink>
              <Stack gap='l1' horizontal>
                <React.Fragment>
                  <JobStatus style={{ width: '33%' }} jobs={jobs} />
                  <VirtualClusterStatistics
                    style={{ width: '33%' }}
                    userInfo={userInfo}
                    virtualClusters={virtualClusters}
                  />
                  <GpuChart
                    style={{ width: '34%' }}
                    gpuPerNode={gpuPerNode}
                    userInfo={userInfo}
                    virtualClusters={virtualClusters}
                  />
                </React.Fragment>
              </Stack>
            </StackItem>
            {/* bottom */}
            <Card className={c(t.h100, t.ph5)}>
              {isAdmin ? (
                <Pivot>
                  <PivotItem
                    headerText='Abnormal jobs'
                    onRenderItemLink={(link, defaultRenderer) => {
                      return (
                        <Stack horizontal gap='s1'>
                          {defaultRenderer(link)}
                          <TooltipIcon
                            content={
                              'A job is treaded as an abnormal job if running more than 5 days or GPU usage is lower than 10%'
                            }
                          />
                        </Stack>
                      );
                    }}
                  >
                    <AbnormalJobList
                      jobs={listAbnormalJobs(jobs, lowGpuJobInfo)}
                    />
                  </PivotItem>
                  <PivotItem headerText='My recent jobs'>
                    <RecentJobList style={{ minHeight: 0 }} jobs={userJobs} />
                  </PivotItem>
                </Pivot>
              ) : (
                <Pivot>
                  <PivotItem headerText='My recent jobs'>
                    <RecentJobList style={{ minHeight: 0 }} jobs={userJobs} />
                  </PivotItem>
                </Pivot>
              )}
            </Card>
          </Stack>
        </MediaQuery>
      </div>
    );
  }
};

const contentWrapper = document.getElementById('content-wrapper');

ReactDOM.render(<Home />, contentWrapper);
