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
import {
  Link,
  Stack,
  FontClassNames,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  DefaultButton,
  CommandButton,
  getTheme,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';

import Card from '../../components/card';
import {getJobDurationString, getJobModifiedTimeString, getHumanizedJobStateString} from '../../components/util/job';
import {zeroPaddingClass} from './util';
import {Header} from './header';
import userAuth from '../../user/user-auth/user-auth.component';
import webportalConfig from '../../config/webportal.config';
import {filterAbnormalJobs} from '../../components/util/job';

// Move it to common folder
import {TooltipIcon} from '../../job-submission/components/controls/tooltip-icon';

import t from '../../components/tachyons.scss';
import StatusBadge from '../../components/status-badge';

const {spacing} = getTheme();

const AbnormalJobList = ({jobs}) => {
  const jobListColumns = [
    {
      key: 'name',
      minWidth: 200,
      name: 'Name',
      fieldName: 'name',
      className: FontClassNames.mediumPlus,
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender(job) {
        const {legacy, name, namespace, username} = job;
        const href = legacy
          ? `/job-detail.html?jobName=${name}`
          : `/job-detail.html?username=${namespace || username}&jobName=${name}`;
        return <Link href={href}>{name}</Link>;
      },
    },
    {
      key: 'gpuCount',
      minWidth: 60,
      name: 'GPUs',
      fieldName: 'totalGpuNumber',
      className: FontClassNames.mediumPlus,
      headerClassName: FontClassNames.medium,
      isResizable: true,
    },
    {
      key: 'modified',
      minWidth: 150,
      name: 'Date Modified',
      className: FontClassNames.mediumPlus,
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender(job) {
        return getJobModifiedTimeString(job);
      },
    },
    {
      key: 'user',
      minWidth: 60,
      name: 'User',
      fieldName: 'username',
      className: FontClassNames.mediumPlus,
      headerClassName: FontClassNames.medium,
      isResizable: true,
    },
    {
      key: 'duration',
      minWidth: 120,
      name: 'Duration',
      className: FontClassNames.mediumPlus,
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender(job) {
        return getJobDurationString(job);
      },
    },
    {
      key: 'virtualCluster',
      minWidth: 100,
      name: 'Virtual Cluster',
      fieldName: 'virtualCluster',
      className: FontClassNames.mediumPlus,
      headerClassName: FontClassNames.medium,
      isResizable: true,
    },
    {
      key: 'status',
      minWidth: 100,
      name: 'Status',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender(job) {
        return <StatusBadge status={getHumanizedJobStateString(job)} />;
      },
    },
    {
      key: 'action',
      minWidth: 100,
      name: 'Action',
      headerClassName: FontClassNames.medium,
      className: zeroPaddingClass,
      isResizable: true,
      onRender(job) {
        return (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            data-selection-disabled
          >
            <DefaultButton
              iconProps={{iconName: 'StopSolid'}}
              styles={{
                root: {backgroundColor: '#e5e5e5'},
                rootFocused: {backgroundColor: '#e5e5e5'},
                rootDisabled: {backgroundColor: '#eeeeee'},
                rootCheckedDisabled: {backgroundColor: '#eeeeee'},
                icon: {fontSize: 12},
              }}
              onClick={(e) => {
                e.stopPropagation();
                stopJob(job);
              }}
            >
              Stop
            </DefaultButton>
          </div>
        );
      },
    },
  ];

  const stopJob = useCallback((job) => {
    userAuth.checkToken((token) => {
      const {name, username} = job;
      fetch(`${webportalConfig.restServerUri}/api/v1/jobs/${username}~${name}/executionType`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({value: 'STOP'}),
      })
      .then((response) => {
        if (response.ok) {
          job.executionType = 'STOP';
          const copyJobs = [...abnormalJobs];
          setAbnormalJobs(copyJobs);
        } else {
          return response.json().then((data) => {
            if (data.code === 'UnauthorizedUserError') {
              alert(data.message);
              userLogout();
            } else {
              throw new Error(data.message);
            }
          });
        }
      }).catch(alert);
    });
  }, [abnormalJobs]);

  const refreshJobs = useCallback(() => {
    fetch(`${webportalConfig.restServerUri}/api/v1/jobs`)
      .then((response) => {
        if (!response.ok) {
          throw Error(response.message);
        } else {
          return response.json();
        }
      })
      .then((jobs) => {
        setAbnormalJobs(filterAbnormalJobs(jobs));
      })
      .catch(alert);
  }, []);

  const [abnormalJobs, setAbnormalJobs] = useState(filterAbnormalJobs(jobs));

  return (
    <Card className={c(t.h100, t.ph5)}>
      <Stack gap='l1' styles={{root: [t.h100]}}>
        <Stack.Item>
          <Header
            headerName='Abnormal jobs'
            linkName='All jobs'
            linkHref='/job-list.html'
            showLink={true}>{
              <Stack horizontal gap='s1'>
                <TooltipIcon content={'The job is treaded as an abnormal job if running more than 5 days and GPU usage is low'}/>
                <CommandButton
                   iconProps={{iconName: 'Refresh'}}
                   styles={{flexContainer: {paddingTop: spacing.s2}, root: {height: '100%'}}}
                   onClick={refreshJobs}
                />
              </Stack>}
            </Header>
        </Stack.Item>
        <Stack.Item styles={{root: {overflow: 'auto', height: '500px'}}}>
          <DetailsList
            columns={jobListColumns}
            disableSelectionZone
            items={abnormalJobs}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            />
        </Stack.Item>
      </Stack>
    </Card>
  );
};

AbnormalJobList.propTypes = {
  jobs: PropTypes.array.isRequired,
};

export default AbnormalJobList;
