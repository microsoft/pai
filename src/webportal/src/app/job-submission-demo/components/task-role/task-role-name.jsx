// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { TextField } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

const PureTaskRoleName = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
  onTaskRoleSelect,
}) => {
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
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        taskRoles: newTaskRoles,
      }),
    );
    onTaskRoleSelect(val);
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
