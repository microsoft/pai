import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { SpinButton } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

const TASK_ROLE_INSTANCES_MIN = 0;

const PureInstance = ({ dispatch, jobProtocol, currentTaskRole }) => {
  const instances = get(
    jobProtocol,
    `taskRoles[${currentTaskRole}].instances`,
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
            instances: value,
          },
        },
      },
    });
  };

  const onIncrement = value => onChange(+value + 1);
  const onDecrement = value => onChange(+value - 1);

  return (
    <SpinButton
      min={TASK_ROLE_INSTANCES_MIN}
      step={1}
      value={instances}
      onIncrement={debounce(onIncrement)}
      onDecrement={debounce(onDecrement)}
    />
  );
};

export const Instance = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureInstance);

PureInstance.propTypes = {
  dispatch: PropTypes.func,
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
};
