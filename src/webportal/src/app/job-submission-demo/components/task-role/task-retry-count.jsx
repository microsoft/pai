import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { SpinButton } from 'office-ui-fabric-react';

const RETRY_COUNT_MIN = 0;

const PureTaskRetryCount = ({ dispatch, jobProtocol, currentTaskRole }) => {
  const taskRetryCount = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].taskRetryCount`,
    0,
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
            taskRetryCount: value,
          },
        },
      },
    });
  };

  const onIncrement = value => onChange(+value + 1);
  const onDecrement = value => onChange(+value - 1);

  return (
    <SpinButton
      min={RETRY_COUNT_MIN}
      step={1}
      value={taskRetryCount}
      onIncrement={debounce(onIncrement)}
      onDecrement={debounce(onDecrement)}
    />
  );
};

export const TaskRetryCount = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureTaskRetryCount);
