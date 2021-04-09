// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { TextField } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

const PureTaskRoleName = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
  onTaskRoleSelect,
}) => {
  const onChange = (_, name) => {
    const taskRoles = get(jobProtocol, 'taskRoles', {});
    if (Object.hasOwnProperty.call(taskRoles, name)) {
      console.log('Task role:' + name + 'is already exist');
      return;
    }
    const updatedTaskRoles = Object.keys(taskRoles).reduce(
      (target, itemKey) => {
        if (itemKey === currentTaskRole) {
          target[name] = taskRoles[itemKey];
        } else {
          target[itemKey] = taskRoles[itemKey];
        }
        return target;
      },
      {},
    );
    onTaskRoleSelect(name);
    onJobProtocolChange({ ...jobProtocol, taskRoles: updatedTaskRoles });
  };

  return (
    <TextField value={currentTaskRole} onChange={debounce(onChange, 200)} />
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
  currentTaskRole: state.JobExtraInfo.currentTaskRole,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
  onTaskRoleSelect: key => {
    dispatch({
      type: 'SAVE_CURRENT_TASKROLE',
      payload: key,
    });
  },
});

export const TaskRoleName = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureTaskRoleName);

PureTaskRoleName.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
  onTaskRoleSelect: PropTypes.func,
};
