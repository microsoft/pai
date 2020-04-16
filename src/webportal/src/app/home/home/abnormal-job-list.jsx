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
  FontClassNames,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  DefaultButton,
  getTheme,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

import {
  getJobDuration,
  getDurationString,
  getJobModifiedTimeString,
  getHumanizedJobStateString,
  isLowGpuUsageJob,
  isLongRunJob,
  isStoppable,
} from '../../components/util/job';
import { zeroPaddingClass } from './util';
import userAuth from '../../user/user-auth/user-auth.component';
import { stopJob } from './conn';
import { cloneDeep } from 'lodash';
import StopJobConfirm from '../../job/job-view/fabric/JobList/StopJobConfirm';

import t from '../../components/tachyons.scss';
import StatusBadge from '../../components/status-badge';

const { palette } = getTheme();

const AbnormalJobList = ({ jobs }) => {
  const [abnormalJobs, setAbnormalJobs] = useState(jobs);
  const [hideDialog, setHideDialog] = useState(true);
  const [currentJob, setCurrentJob] = useState(null);

  const jobListColumns = [
    {
      key: 'name',
      minWidth: 200,
      name: 'Name',
      fieldName: 'name',
      className: FontClassNames.mediumPlus,
      isResizable: true,
      onRender(job) {
        const { legacy, name, namespace, username } = job;
        const href = legacy
          ? `/job-detail.html?jobName=${name}`
          : `/job-detail.html?username=${namespace ||
              username}&jobName=${name}`;
        return <Link href={href}>{name}</Link>;
      },
    },
    {
      key: 'gpuCount',
      minWidth: 50,
      name: 'GPUs',
      fieldName: 'totalGpuNumber',
      className: FontClassNames.mediumPlus,
      isResizable: true,
      onRender(job) {
        if (isLowGpuUsageJob(job)) {
          return (
            <div style={{ color: palette.red }}>{`count: ${
              job.totalGpuNumber
            }  usage: ${Number.parseFloat(job.gpuUsage).toFixed(2)}%`}</div>
          );
        }
        return job.totalGpuNumber;
      },
    },
    {
      key: 'modified',
      minWidth: 150,
      name: 'Date Modified',
      className: FontClassNames.mediumPlus,
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
      isResizable: true,
    },
    {
      key: 'duration',
      minWidth: 120,
      name: 'Duration',
      className: FontClassNames.mediumPlus,
      isResizable: true,
      onRender(job) {
        if (isLongRunJob(job)) {
          return (
            <div style={{ color: palette.red }}>
              {getDurationString(getJobDuration(job))}
            </div>
          );
        }
        return getDurationString(getJobDuration(job));
      },
    },
    {
      key: 'virtualCluster',
      minWidth: 100,
      name: 'Virtual Cluster',
      fieldName: 'virtualCluster',
      className: FontClassNames.mediumPlus,
      isResizable: true,
    },
    {
      key: 'status',
      minWidth: 100,
      name: 'Status',
      isResizable: true,
      onRender(job) {
        return <StatusBadge status={getHumanizedJobStateString(job)} />;
      },
    },
    {
      key: 'action',
      minWidth: 100,
      name: 'Action',
      className: zeroPaddingClass,
      isResizable: true,
      onRender(job) {
        const disabled = !isStoppable(job);
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
              iconProps={{ iconName: 'StopSolid' }}
              disabled={disabled}
              styles={{
                root: { backgroundColor: '#e5e5e5' },
                rootFocused: { backgroundColor: '#e5e5e5' },
                rootDisabled: { backgroundColor: '#eeeeee' },
                rootCheckedDisabled: { backgroundColor: '#eeeeee' },
                icon: { fontSize: 12 },
              }}
              onClick={e => {
                e.stopPropagation();
                setCurrentJob(job);
                setHideDialog(false);
              }}
            >
              Stop
            </DefaultButton>
          </div>
        );
      },
    },
  ];

  const stopAbnormalJob = useCallback(
    job => {
      userAuth.checkToken(() => {
        stopJob(job)
          .then(() => {
            const result = cloneDeep(abnormalJobs);
            const stopJob = result.find(item => item.name === job.name);
            stopJob.executionType = 'STOP';
            setAbnormalJobs(result);
          })
          .catch(alert);
      });
    },
    [abnormalJobs, setAbnormalJobs],
  );

  return (
    <div>
      <DetailsList
        styles={{ root: { minHeight: 200, overflow: 'auto' } }}
        columns={jobListColumns}
        disableSelectionZone
        items={abnormalJobs}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
      <StopJobConfirm
        hideDialog={hideDialog}
        currentJob={currentJob}
        setHideDialog={setHideDialog}
        stopJob={stopAbnormalJob}
      />
    </div>
  );
};

AbnormalJobList.propTypes = {
  jobs: PropTypes.array.isRequired,
};

export default AbnormalJobList;
