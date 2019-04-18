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

import {FontClassNames, ColorClassNames} from '@uifabric/styling';
import c from 'classnames';
import {IconButton} from 'office-ui-fabric-react/lib/Button';
import PropTypes from 'prop-types';
import React from 'react';

import t from '../../../../../components/tachyons.scss';

import Card from './card';
import MonacoCallout from './monaco-callout';
import TaskRoleContainerList from './task-role-container-list';
import {statusColorMapping} from '../../../../../components/theme';

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
    this.setState({containerListExpanded: true});
  }

  collapseContainerList() {
    this.setState({containerListExpanded: false});
  }

  renderTaskRoleCount() {
    const {taskInfo, taskConfig} = this.props;
    const count = {
      running: 0,
      succeeded: 0,
      failed: 0,
      unknown: 0,
    };
    if (taskInfo && taskInfo.taskStatuses) {
      for (const item of taskInfo.taskStatuses) {
        switch (item.taskState) {
          case 'RUNNING':
          case 'WAITING':
            count.running += 1;
            break;
          case 'SUCCEEDED':
            count.succeeded += 1;
            break;
          case 'FAILED':
            count.failed += 1;
            break;
          default:
            count.unknown += 1;
            break;
        }
      }
    } else if (taskConfig && taskConfig.taskNumber) {
      count.unknown = taskConfig.taskNumber;
    } else {
      // task status info not available
      return;
    }

    return (
      <div className={c(t.flex, t.itemsCenter)}>
        {Object.keys(count).filter((x) => count[x] > 0).map((x) => (
          <div key={x} className={c(t.mr3, t.flex, t.itemsCenter)}>
            <div className={c(t.br100, t.h1, t.w1)} style={{backgroundColor: statusColorMapping[x]}}>
            </div>
            <div className={c(t.ml2)}>{count[x]}</div>
          </div>
        ))}
      </div>
    );
  }

  render() {
    const {className, taskInfo, taskConfig, jobStatus, sshInfo} = this.props;
    const {containerListExpanded} = this.state;
    const name = (taskInfo && taskInfo.taskRoleStatus.name) || (taskConfig && taskConfig.name);

    return (
      <div className={className}>
        {/* summary */}
        <Card>
          <div className={c(t.pv3, t.flex, t.itemsCenter, t.justifyBetween)} style={{paddingLeft: 32, paddingRight: 32}}>
            {/* left */}
            <div className={c(t.flex, t.itemsCenter)}>
              <div className={c(FontClassNames.large)}>
                <span >Task Role:</span>
                <span className={t.ml3}>{name}</span>
              </div>
              {taskConfig && (
                <MonacoCallout language='json' value={JSON.stringify(taskConfig, null, 2)}>
                  <IconButton className={ColorClassNames.themePrimary} iconProps={{iconName: 'Info'}} />
                </MonacoCallout>
              )}
              {/* status */}
              <div className={c(t.ml5, t.flex, t.itemsCenter, t.justifyStart)}>
                <div className={c(t.ml3)}>
                  {this.renderTaskRoleCount()}
                </div>
              </div>
            </div>
            {/* right */}
            <div>
              {containerListExpanded
                ? <IconButton iconProps={{iconName: 'ChevronUp'}} onClick={this.collapseContainerList}/>
                : <IconButton iconProps={{iconName: 'ChevronDown'}} onClick={this.expandContainerList} />
              }
            </div>
          </div>
          {containerListExpanded && (
            <TaskRoleContainerList
              style={{paddingLeft: 32, paddingRight: 32}}
              taskInfo={taskInfo}
              taskConfig={taskConfig}
              jobStatus={jobStatus}
              sshInfo={sshInfo}
            />
          )}
        </Card>
      </div>
    );
  }
}

TaskRole.propTypes = {
  className: PropTypes.string,
  taskInfo: PropTypes.object,
  jobStatus: PropTypes.string.isRequired,
  taskConfig: PropTypes.object,
  sshInfo: PropTypes.object,
};
