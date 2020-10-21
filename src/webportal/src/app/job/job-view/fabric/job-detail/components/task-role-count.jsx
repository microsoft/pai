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
import { capitalize } from 'lodash';
import { TooltipHost, Text } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../../../../../components/tachyons.scss';

import { statusColor } from '../../../../../components/theme';

const TaskRoleCount = ({ taskInfo }) => {
  const count = {
    running: 0,
    waiting: 0,
    succeeded: 0,
    failed: 0,
    stopped: 0,
    unknown: 0,
  };
  if (taskInfo && taskInfo.taskStatuses) {
    for (const item of taskInfo.taskStatuses) {
      switch (item.taskState) {
        case 'RUNNING':
          count.running += 1;
          break;
        case 'WAITING':
        case 'STOPPING':
          count.waiting += 1;
          break;
        case 'SUCCEEDED':
          count.succeeded += 1;
          break;
        case 'FAILED':
          count.failed += 1;
          break;
        case 'STOPPED':
          count.stopped += 1;
          break;
        default:
          count.unknown += 1;
          break;
      }
    }
  } else {
    // task status info not available
    return;
  }

  return (
    <div className={c(t.flex, t.itemsCenter)}>
      {Object.keys(count)
        .filter(x => count[x] > 0)
        .map(x => (
          <div key={x} className={c(t.mr3, t.flex, t.itemsCenter)}>
            <TooltipHost
              calloutProps={{ isBeakVisible: false, gapSpace: 8 }} // spacing.s1
              content={capitalize(x)}
            >
              <div
                className={c(t.br100, t.h1, t.w1, t.mr2)}
                style={{ backgroundColor: statusColor[x] }}
              ></div>
            </TooltipHost>
            <Text>{count[x]}</Text>
          </div>
        ))}
    </div>
  );
};

TaskRoleCount.propTypes = {
  taskInfo: PropTypes.object.isRequired,
};

export default TaskRoleCount;
