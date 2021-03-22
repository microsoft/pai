// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { FormSpinButton } from '../controls/form-spin-button';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

const SUCCEED_INSTANCES_MIN = -1;

const PureMinSucceedInstances = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
}) => {
  const minSucceedInstances = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].completion.minSucceedInstances`,
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
              minSucceedInstances: value,
            },
          },
        },
      }),
    );
  };

  return (
    <FormSpinButton
      min={SUCCEED_INSTANCES_MIN}
      step={1}
      value={minSucceedInstances}
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

export const MinSucceedInstances = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureMinSucceedInstances);

PureMinSucceedInstances.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
};
