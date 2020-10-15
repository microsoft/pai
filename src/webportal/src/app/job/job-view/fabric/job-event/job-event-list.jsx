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

import { FontClassNames } from '@uifabric/styling';
import { DateTime } from 'luxon';
import {
  DetailsList,
  SelectionMode,
  DetailsListLayoutMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import PropTypes from 'prop-types';
import React from 'react';

const JobEventList = props => {
  const { jobEvents } = props;

  const columns = [
    {
      key: 'uid',
      name: 'uid',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.uid}</div>;
      },
    },
    {
      key: 'taskRoleName',
      name: 'Task Role Name',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>{item.taskroleName}</div>
        );
      },
    },
    {
      key: 'taskIndex',
      name: 'Task Index',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>{item.taskIndex}</div>
        );
      },
    },
    {
      key: 'type',
      name: 'Type',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.type}</div>;
      },
    },
    {
      key: 'reason',
      name: 'Reason',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.reason}</div>;
      },
    },
    {
      key: 'message',
      name: 'message',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.message}</div>;
      },
    },
    {
      key: 'firstTimestamp',
      name: 'First Timestamp',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>
            {DateTime.fromISO(item.firstTimestamp).toLocaleString()}
          </div>
        );
      },
    },
    {
      key: 'lastTimestamp',
      name: 'Last Timestamp',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>
            {DateTime.fromISO(item.lastTimestamp).toLocaleString()}
          </div>
        );
      },
    },
    {
      key: 'count',
      name: 'Count',
      headerClassName: FontClassNames.medium,
      isResizable: true,
      onRender: (item, idx) => {
        return <div className={FontClassNames.mediumPlus}>{item.count}</div>;
      },
    },
  ];

  return (
    <DetailsList
      columns={columns}
      disableSelectionZone
      items={jobEvents}
      layoutMode={DetailsListLayoutMode.justified}
      selectionMode={SelectionMode.none}
    />
  );
};

JobEventList.propTypes = {
  jobEvents: PropTypes.arrayOf(PropTypes.object),
};

export default JobEventList;
