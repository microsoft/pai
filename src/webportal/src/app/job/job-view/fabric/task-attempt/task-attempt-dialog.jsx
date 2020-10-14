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

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import {
  PrimaryButton,
  DefaultButton,
  Dialog,
  DialogFooter,
} from 'office-ui-fabric-react';
import TaskAttemptList from './task-attempt-list';
import { fetchTaskStatus } from '../fabric/job-detail/conn';

const TaskAttemptDialog = props => {
  const {
    hideDialog,
    toggleHideDialog,
    jobAttemptIndex,
    taskRoleName,
    taskIndex,
  } = props;
  const [taskAttempts, setTaskAttempts] = useState([]);

  useEffect(() => {
    if (!isNil(jobAttemptIndex) && !isNil(taskRoleName) && !isNil(taskIndex)) {
      fetchTaskStatus(jobAttemptIndex, taskRoleName, taskIndex).then(
        taskStatus => {
          const attempts = taskStatus.attempts;
          setTaskAttempts(attempts);
        },
      );
    }
  }, [jobAttemptIndex, taskRoleName, taskIndex]);

  return (
    <Dialog
      hidden={hideDialog}
      onDismiss={toggleHideDialog}
      dialogContentProps={{ title: 'Task Attempt Details' }}
      minWidth={1000}
    >
      <TaskAttemptList taskAttempts={taskAttempts} />
      <DialogFooter>
        <PrimaryButton onClick={toggleHideDialog} text='OK' />
        <DefaultButton onClick={toggleHideDialog} text='Close' />
      </DialogFooter>
    </Dialog>
  );
};

TaskAttemptDialog.propTypes = {
  hideDialog: PropTypes.bool,
  toggleHideDialog: PropTypes.func,
  jobAttemptIndex: PropTypes.number,
  taskRoleName: PropTypes.string,
  taskIndex: PropTypes.number,
};

export default TaskAttemptDialog;
