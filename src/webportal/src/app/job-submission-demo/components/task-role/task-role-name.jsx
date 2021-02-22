// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { TextField } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

const PureTaskRoleName = ({ dispatch, jobProtocol, currentTaskRole }) => {
  const { taskRoles } = jobProtocol;

  const onChange = (_, val) => {
    if (get(taskRoles, val)) {
      return;
    }
    const newTaskRoles = Object.keys(taskRoles).reduce((res, key) => {
      if (key === currentTaskRole) {
        res[val] = taskRoles[key];
      } else {
        res[key] = taskRoles[key];
      }
      return res;
    }, {});
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
        ...jobProtocol,
        taskRoles: newTaskRoles,
      },
    });
    dispatch({
      type: 'SAVE_CURRENT_TASKROLE',
      payload: val,
    });
  };

  return (
    <TextField value={currentTaskRole} onChange={debounce(onChange, 200)} />
  );
};

export const TaskRoleName = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureTaskRoleName);

PureTaskRoleName.propTypes = {
  dispatch: PropTypes.func,
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
};
