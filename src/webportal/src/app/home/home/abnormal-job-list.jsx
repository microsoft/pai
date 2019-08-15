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
import {isEmpty} from 'lodash';
import {
  Link,
  Stack,
  FontClassNames,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  DefaultButton,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React from 'react';

import Card from '../../components/card';
import {getJobDurationString, getJobModifiedTimeString, getHumanizedJobStateString, getJobModifiedTime} from '../../components/util/job';
import {zeroPaddingClass} from './util';
import {Header} from './header';

import t from '../../components/tachyons.scss';
import StatusBadge from '../../components/status-badge';

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
          >
            Stop
          </DefaultButton>
        </div>
      );
    },
  },
];

const Content = ({jobs}) => {
  if (true && isEmpty(jobs)) {
    return;
  }

  const items = jobs
    .slice()
    .sort((a, b) => getJobModifiedTime(b) - getJobModifiedTime(a))
    .slice(0, 10);
  return (
    <div className={c(t.h100, t.overflowYAuto)}>
      <DetailsList
        columns={jobListColumns}
        disableSelectionZone
        items={items}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
    </div>
  );
};

Content.propTypes = {
  jobs: PropTypes.array.isRequired,
};

const AbnormalJobList = ({className, jobs}) => {
  return (
    <Card className={c(className, t.ph5)}>
      <Stack styles={{root: [className]}} gap='l1'>
        <Stack.Item>
          <Header
            headerName='Abnormal jobs'
            linkName='All jobs'
            linkHref='/job-list.html'
            showLink={true} />
        </Stack.Item>
        <Stack.Item styles={{root: [{flexBasis: 0}]}} grow>
          <Content jobs={jobs} />
        </Stack.Item>
      </Stack>
    </Card>
  );
};

AbnormalJobList.propTypes = {
  className: PropTypes.string,
  jobs: PropTypes.array.isRequired,
};

export default AbnormalJobList;
