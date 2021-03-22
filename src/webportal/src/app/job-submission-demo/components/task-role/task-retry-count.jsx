// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { FormSpinButton } from '../controls/form-spin-button';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

const RETRY_COUNT_MIN = 0;

const PureTaskRetryCount = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
}) => {
  const taskRetryCount = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].taskRetryCount`,
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
            taskRetryCount: value,
          },
        },
      }),
    );
  };

  return (
    <FormSpinButton
      min={RETRY_COUNT_MIN}
      step={1}
      value={taskRetryCount}
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

export const TaskRetryCount = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureTaskRetryCount);

PureTaskRetryCount.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
};
