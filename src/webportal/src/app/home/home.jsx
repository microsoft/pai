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
import {initializeIcons, FontClassNames, Stack} from 'office-ui-fabric-react';
import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';

import JobStatus from './home/job-status';
import VirtualClusterList from './home/virtual-cluster-list';
import GpuChart from './home/gpu-chart';
import {listJobs, getTotalGpu, getUserInfo, listVirtualClusters, getAvailableGpuPerNode} from './home/conn';
import RecentJobList from './home/recent-job-list';
import {SpinnerLoading} from '../components/loading';
import {initTheme} from '../components/theme';

import t from '../components/tachyons.css';

initTheme();
initializeIcons();

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [virtualClusters, setVirtualClusters] = useState(null);
  const [totalGpu, setTotalGpu] = useState(null);
  const [gpuPerNode, setGpuPerNode] = useState(null);

  useEffect(() => {
    Promise.all([
      listJobs().then(setJobs),
      getUserInfo().then(setUserInfo),
      listVirtualClusters().then(setVirtualClusters),
      getTotalGpu().then(setTotalGpu),
      getAvailableGpuPerNode().then(setGpuPerNode),
    ]).then(() => setLoading(false)).catch(alert);
  }, []);

  if (loading) {
    return <SpinnerLoading />;
  } else {
    // about height 0: https://github.com/philipwalton/flexbugs/issues/197#issuecomment-378908438
    return (
      <Stack
        styles={{root: [t.w100, t.h100, FontClassNames.medium]}}
        padding='l2'
        gap='l2'
      >
        {/* top */}
        <Stack.Item grow={0}>
          <Stack
            horizontal
            horizontalAlign='space-evenly'
            gap='l2'
          >
            <Stack.Item styles={{root: [t.w33]}}>
              <JobStatus jobs={jobs} />
            </Stack.Item>
            <Stack.Item styles={{root: [t.w33]}}>
              <VirtualClusterList
                className={t.h100}
                userInfo={userInfo}
                totalGpu={totalGpu}
                virtualClusters={virtualClusters}
              />
            </Stack.Item>
            <Stack.Item styles={{root: [t.w33]}}>
              <GpuChart gpuPerNode={gpuPerNode} className={t.h100} />
            </Stack.Item>
          </Stack>
        </Stack.Item>
        {/* recent jobs */}
        <Stack.Item styles={{root: [{height: 0}]}} grow>
          <RecentJobList className={c(t.h100)} jobs={jobs} />
        </Stack.Item>
      </Stack>
    );
  }
};

const contentWrapper = document.getElementById('content-wrapper');

ReactDOM.render(<Home />, contentWrapper);

document.getElementById('sidebar-menu--home').classList.add('active');
