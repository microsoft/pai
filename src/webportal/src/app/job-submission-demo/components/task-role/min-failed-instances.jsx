// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { SpinButton } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

const FAILED_INSTANCES_MIN = -1;

const PureMinFailedInstances = ({ dispatch, jobProtocol, currentTaskRole }) => {
  const minFailedInstances = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].completion.minFailedInstances`,
    1,
  );

  const onChange = value => {
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
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
      },
    });
  };

  const onIncrement = value => onChange(+value + 1);
  const onDecrement = value => onChange(+value - 1);

  return (
    <SpinButton
      min={FAILED_INSTANCES_MIN}
      step={1}
      value={minFailedInstances}
      onIncrement={debounce(onIncrement)}
      onDecrement={debounce(onDecrement)}
    />
  );
};

export const MinFailedInstances = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureMinFailedInstances);

PureMinFailedInstances.propTypes = {
  dispatch: PropTypes.func,
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
};
