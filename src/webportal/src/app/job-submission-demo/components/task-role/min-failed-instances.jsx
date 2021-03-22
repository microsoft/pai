// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { FormSpinButton } from '../controls/form-spin-button';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

const FAILED_INSTANCES_MIN = -1;

const PureMinFailedInstances = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
}) => {
  const minFailedInstances = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].completion.minFailedInstances`,
    1,
  );

  const onChange = value => {
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        taskRoles: {
          ...jobProtocol.taskRoles,
          [currentTaskRole]: {
            ...jobProtocol.taskRoles[currentTaskRole],
            completion: {
              ...jobProtocol.taskRoles[currentTaskRole].completion,
              minFailedInstances: value,
            },
          },
        },
      }),
    );
  };

  return (
    <FormSpinButton
      min={FAILED_INSTANCES_MIN}
      step={1}
      value={minFailedInstances}
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

export const MinFailedInstances = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureMinFailedInstances);

PureMinFailedInstances.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
};
