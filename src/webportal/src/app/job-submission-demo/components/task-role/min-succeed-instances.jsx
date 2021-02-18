import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { SpinButton } from 'office-ui-fabric-react';

const SUCCEED_INSTANCES_MIN = -1;

const PureMinSucceedInstances = ({
  dispatch,
  jobProtocol,
  currentTaskRole,
}) => {
  const minSucceedInstances = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].completion.minSucceedInstances`,
    1,
  );

  const onChange = (value) => {
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
              minSucceedInstances: value,
            },
          },
        },
      },
    });
  };

  const onIncrement = (value) => onChange(+value + 1);
  const onDecrement = (value) => onChange(+value - 1);

  return (
    <SpinButton
      min={SUCCEED_INSTANCES_MIN}
      step={1}
      value={minSucceedInstances}
      onIncrement={debounce(onIncrement)}
      onDecrement={debounce(onDecrement)}
    />
  );
};

export const MinSucceedInstances = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureMinSucceedInstances);
