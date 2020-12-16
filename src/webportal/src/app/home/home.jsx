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
import {initializeIcons, Stack, StackItem, Toggle, FontClassNames} from 'office-ui-fabric-react';
import React, {useState, useEffect} from 'react';

import JobStatus from './home/job-status';
import VirtualCluster from './home/virtual-cluster';
import SelectSubcluster from './home/select-subcluster';
import {listAggregatedVirtualClusters, listSchedulerVirtualClusters, getUserGrouplist, UnauthorizedError} from './home/conn';
import {SpinnerLoading} from '../components/loading';
import {initTheme} from '../components/theme';
import {userLogout} from '../user/user-logout/user-logout.component.js';
import {getSubClusters, getVirtualCluster2Subclusters, getVirtualClusterScheduler2Subclusters} from './home/util';
import {renderWithErrorBoundary} from '../components/error-boundary';

import t from '../components/tachyons.scss';

initTheme();
initializeIcons();

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [subClustersList, setSubClustersList]= useState([]);
  const [schedulerVirtualClusters, setSchedulerVirtualClusters]= useState({});
  const [aggregatedVirtualClusters, setAggregatedVirtualClusters]= useState({});
  const [userGroupList, setUserGroupList] = useState({});
  const [navigatedByCluster, setNavigatedByCluster] = useState(false);

  useEffect(() => {
    if (!isEmpty(cookies.get('user'))) {
      setSubClustersList(getSubClusters);
      Promise.all([
        listSchedulerVirtualClusters().then(setSchedulerVirtualClusters),
        listAggregatedVirtualClusters().then(setAggregatedVirtualClusters),
        getUserGrouplist().then(setUserGroupList),
      ]).then(() => {
        setLoading(false);
      }).catch((err) => {
        if (err instanceof UnauthorizedError) {
          alert(err);
          userLogout();
        } else {
          setLoading(false);
          alert(err.toString());
        }
      });
    } else {
      // layout.component.js will redirect user to index page.
    }
  }, []);

  if (loading) {
    return <SpinnerLoading />;
  } else {
    if (!isEmpty(schedulerVirtualClusters) ) {
      const virtualCluster2Subclusters = getVirtualClusterScheduler2Subclusters(schedulerVirtualClusters, subClustersList);
      const virtualCluster = !isEmpty(aggregatedVirtualClusters) ? getVirtualCluster2Subclusters(aggregatedVirtualClusters, subClustersList) : {};

      return (
        <Stack style={{width: '100%', height: '100%', minWidth: 1200}}>
            <StackItem className={c(t.borderBox, t.bgWhite, t.ph4, t.pt4, t.pb2)} styles={{root: {height: 300}}} >
              <JobStatus
                userGroupList={userGroupList}
                subClusters={subClustersList}
                jobs={virtualCluster2Subclusters ? virtualCluster2Subclusters.virtualClusters : {}}
                />
            </StackItem>
            <StackItem grow={1} className={c(t.borderBox, t.bgWhite, t.ph4, t.pt2, t.pb3, t.overflowHidden)} >
              <VirtualCluster
                userGroupList={userGroupList}
                subClusters={subClustersList}
                virtualCluster2Subclusters={virtualCluster2Subclusters}
                virtualCluster={virtualCluster}
                aggregatedVirtualClusters={schedulerVirtualClusters}
              />
            </StackItem>
        </Stack>
      );
    } else {
      const virtualCluster2Subclusters = !isEmpty(aggregatedVirtualClusters) ? getVirtualCluster2Subclusters(aggregatedVirtualClusters, subClustersList) : {};
      const shouldNavigateByCluster = (!(virtualCluster2Subclusters && Object.keys(virtualCluster2Subclusters).length > 0)) || navigatedByCluster;
      const onToggleChanged = (isChecked) => {
        setNavigatedByCluster(isChecked);
      };

      return (
        <Stack
          styles={{root: [t.w100, t.h100L]}}
          padding='l1'
          gap='l0'
        >
          <Stack.Item>
            <Stack
            >
            <Toggle
              className={FontClassNames.xxLargePlus}
              label={'Navigate by cluster'}
              onText="On"
              offText="Off"
              defaultChecked={navigatedByCluster}
              onChange={((ev, isChecked) =>onToggleChanged(isChecked))}
              disabled={!(virtualCluster2Subclusters && Object.keys(virtualCluster2Subclusters).length > 0)}
            />
            </Stack>
          </Stack.Item>
          {/* top */}
           { shouldNavigateByCluster && (<Stack.Item>
            <SelectSubcluster subClusters={subClustersList} aggregatedVirtualClusters={aggregatedVirtualClusters? aggregatedVirtualClusters.Clusters : ''} userGroupList={userGroupList} navigatedByCluster={shouldNavigateByCluster}/> {/*  subcluster-> virtual clusters here */}
            </Stack.Item>)
          }
          { !shouldNavigateByCluster && (<Stack.Item>
            <SelectSubcluster subClusters={Object.keys(virtualCluster2Subclusters)} aggregatedVirtualClusters={virtualCluster2Subclusters? virtualCluster2Subclusters : ''} userGroupList={userGroupList} navigatedByCluster={shouldNavigateByCluster}/> {/*  virtual cluster -> subclusters here */}
            </Stack.Item>)
          }
        </Stack>
      );
    }
  }
};

const contentWrapper = document.getElementById('content-wrapper');

renderWithErrorBoundary(<Home />, contentWrapper);
