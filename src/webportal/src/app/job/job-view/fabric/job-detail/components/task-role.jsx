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

import { FontClassNames, ColorClassNames, getTheme } from '@uifabric/styling';
import c from 'classnames';
import { capitalize } from 'lodash';
import { Icon, IconButton, TooltipHost } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';

import t from '../../../../../components/tachyons.scss';

import Card from './card';
import Context from './context';
import TaskRoleContainerList from './task-role-container-list';
import { getTaskConfig } from '../util';
import MonacoCallout from '../../../../../components/monaco-callout';
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
                className={c(t.br100, t.h1, t.w1)}
                style={{ backgroundColor: statusColor[x] }}
              ></div>
            </TooltipHost>
            <div className={c(t.ml2)}>{count[x]}</div>
          </div>
        ))}
    </div>
  );
};

TaskRoleCount.propTypes = {
  taskInfo: PropTypes.object.isRequired,
};

export default class TaskRole extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      containerListExpanded: true,
    };
    this.taskConfigButtonRef = React.createRef();
    this.expandContainerList = this.expandContainerList.bind(this);
    this.collapseContainerList = this.collapseContainerList.bind(this);
  }

  expandContainerList() {
    this.setState({ containerListExpanded: true });
  }

  collapseContainerList() {
    this.setState({ containerListExpanded: false });
  }

  render() {
    const { className, name, taskInfo, isFailed } = this.props;
    const { containerListExpanded } = this.state;
    const { semanticColors } = getTheme();
    const { rawJobConfig } = this.context;
    const taskConfig = getTaskConfig(rawJobConfig, name);
    return (
      <div className={c(t.bgWhite, className)}>
        {/* summary */}
        <Card
          style={{
            backgroundColor: isFailed
              ? semanticColors.errorBackground
              : undefined,
          }}
        >
          <div
            className={c(t.pv3, t.ph5, t.flex, t.itemsCenter, t.justifyBetween)}
          >
            {/* left */}
            <div className={c(t.flex, t.itemsCenter)}>
              {isFailed && (
                <div className={c(t.mr3, FontClassNames.large)}>
                  <Icon
                    style={{ color: semanticColors.errorText }}
                    iconName='ErrorBadge'
                  />
                </div>
              )}
              <div className={c(FontClassNames.large)}>
                <span>Task Role:</span>
                <span className={t.ml3}>{name}</span>
              </div>
              {taskConfig && (
                <MonacoCallout
                  monacoProps={{
                    language: 'yaml',
                    value: yaml.safeDump(taskConfig),
                  }}
                >
                  <IconButton
                    className={ColorClassNames.themePrimary}
                    iconProps={{ iconName: 'Info' }}
                  />
                </MonacoCallout>
              )}
              {/* status */}
              <div className={c(t.ml5, t.flex, t.itemsCenter, t.justifyStart)}>
                <div>Status:</div>
                <div className={c(t.ml3)}>
                  <TaskRoleCount taskInfo={taskInfo} />
                </div>
              </div>
            </div>
            {/* right */}
            <div>
              {containerListExpanded ? (
                <IconButton
                  iconProps={{ iconName: 'ChevronUp' }}
                  onClick={this.collapseContainerList}
                />
              ) : (
                <IconButton
                  iconProps={{ iconName: 'ChevronDown' }}
                  onClick={this.expandContainerList}
                />
              )}
            </div>
          </div>
          {containerListExpanded && (
            <TaskRoleContainerList className={t.ph5} taskInfo={taskInfo} />
          )}
        </Card>
      </div>
    );
  }
}

TaskRole.contextType = Context;

TaskRole.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  taskInfo: PropTypes.object.isRequired,
  isFailed: PropTypes.bool,
};
