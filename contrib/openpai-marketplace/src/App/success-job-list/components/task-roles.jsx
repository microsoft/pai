import React from 'react';
import { isNil, isEmpty, get } from 'lodash';
import PropTypes from 'prop-types';

import t from '../../components/tachyons.scss';
import { getHumanizedJobStateString } from '../utils/job';
import TaskRole from './task-role';

const TaskRoles = props => {
  const { jobConfig, jobInfo, logType, launcherType } = props;

  if (!isEmpty(jobInfo.taskRoles)) {
    const failedTaskRole =
      getHumanizedJobStateString(jobInfo.jobStatus) === 'Failed' &&
      get(jobInfo, 'jobStatus.appExitTriggerTaskRoleName');
    return Object.keys(jobInfo.taskRoles).map(name => (
      <TaskRole
        key={name}
        className={t.mt3}
        name={name}
        taskInfo={jobInfo.taskRoles[name]}
        isFailed={failedTaskRole && name === failedTaskRole}
      />
    ));
  } else if (jobConfig && jobConfig.taskRoles) {
    return Object.entries(jobConfig.taskRoles).map(([name, taskConfig]) => {
      // dummy tasks
      let dummyTaskInfo = null;
      if (taskConfig) {
        const instances = isNil(taskConfig.instances)
          ? 1
          : taskConfig.instances;
        dummyTaskInfo = {
          taskStatuses: Array.from({ length: instances }, (v, idx) => ({
            taskState: 'WAITING',
          })),
        };
      }

      return (
        <TaskRole
          key={name}
          name={name}
          className={t.mt3}
          taskInfo={dummyTaskInfo}
          logType={logType}
          launcherType={launcherType}
        />
      );
    });
  } else {
    return null;
  }
};

TaskRoles.propTypes = {
  jobConfig: PropTypes.object.isRequired,
  jobInfo: PropTypes.object.isRequired,
  logType: PropTypes.string,
  launcherType: PropTypes.string,
};

export default TaskRoles;
