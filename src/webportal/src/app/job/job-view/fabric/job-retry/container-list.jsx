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

import { FontClassNames, getTheme } from '@uifabric/styling';
import c from 'classnames';
import { capitalize, isNil } from 'lodash';
import { Link } from 'office-ui-fabric-react';
import {
  DetailsList,
  SelectionMode,
  DetailsListLayoutMode,
} from 'office-ui-fabric-react/lib/DetailsList';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../../../../components/tachyons.scss';

import StatusBadge from '../../../../components/status-badge';

const { palette } = getTheme();

export const ContainerList = ({ taskStatuses }) => {
  const columns = [
    {
      key: 'number',
      name: 'No.',
      headerClassName: FontClassNames.medium,
      minWidth: 50,
      maxWidth: 50,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          !isNil(idx) && <div className={FontClassNames.mediumPlus}>{idx}</div>
        );
      },
    },
    {
      key: 'name',
      name: 'Container ID',
      headerClassName: FontClassNames.medium,
      minWidth: 100,
      maxWidth: 500,
      isResizable: true,
      onRender: item => {
        const id = item.containerId;
        return (
          !isNil(id) && (
            <div className={c(t.truncate, FontClassNames.mediumPlus)}>{id}</div>
          )
        );
      },
    },
    {
      key: 'containerIP',
      name: 'Container IP',
      headerClassName: FontClassNames.medium,
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      onRender: (item, idx) => {
        return (
          <div className={FontClassNames.mediumPlus}>{item.containerIp}</div>
        );
      },
    },
    {
      key: 'status',
      name: 'Status',
      headerClassName: FontClassNames.medium,
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      onRender: item => <StatusBadge status={capitalize(item.taskState)} />,
    },
    {
      key: 'userLog',
      name: 'User Log',
      headerClassName: FontClassNames.medium,
      minWidth: 100,
      maxWidth: 100,
      onRender: item => {
        const logUrl = item.containerLog;
        const allLogUrl = `${logUrl}user.pai.all`;
        return (
          !isNil(logUrl) && (
            <Link
              styles={{ root: [FontClassNames.mediumPlus] }}
              href={allLogUrl}
              target='_blank'
            >
              User Log
            </Link>
          )
        );
      },
    },
    {
      key: 'logFolder',
      name: 'Log Folder',
      headerClassName: FontClassNames.medium,
      minWidth: 100,
      maxWidth: 100,
      onRender: item => {
        const logUrl = item.containerLog;
        return (
          !isNil(logUrl) && (
            <Link
              styles={{ root: [FontClassNames.mediumPlus] }}
              href={logUrl}
              target='_blank'
            >
              Log Folder
            </Link>
          )
        );
      },
    },
  ];

  return (
    <div style={{ backgroundColor: palette.neutralLight }}>
      <DetailsList
        columns={columns}
        disableSelectionZone
        items={taskStatuses}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
    </div>
  );
};

ContainerList.propTypes = {
  taskStatuses: PropTypes.arrayOf(PropTypes.object),
};
