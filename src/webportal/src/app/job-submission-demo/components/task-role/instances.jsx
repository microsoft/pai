// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { FormSpinButton } from '../controls/form-spin-button';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

const TASK_ROLE_INSTANCES_MIN = 0;

const PureInstance = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
}) => {
  const instances = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].instances`,
    0,
  );

  const onChange = value => {
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        taskRoles: {
          ...jobProtocol.taskRoles,
          [currentTaskRole]: {
            ...jobProtocol.taskRoles[currentTaskRole],
            instances: value,
          },
        },
      }),
    );
  };

  return (
    <FormSpinButton
      min={TASK_ROLE_INSTANCES_MIN}
      step={1}
      value={instances}
      onChange={onChange}
    />
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
  currentTaskRole: state.JobExtraInfo.currentTaskRole,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const Instance = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureInstance);

PureInstance.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
};
