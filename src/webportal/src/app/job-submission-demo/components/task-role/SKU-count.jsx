import React from 'react';
import { connect } from 'react-redux';
import { debounce, get } from 'lodash';
import { SpinButton } from 'office-ui-fabric-react';

const SKU_COUNT_MIN = 0;

const PureSKUCount = ({ dispatch, jobProtocol, currentTaskRole }) => {
  const skuNum = get(
    jobProtocol,
    `extras.hivedScheduler.taskRoles[${currentTaskRole}].skuNum`,
    0,
  );

  const onChange = value => {
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
        ...jobProtocol,
        extras: {
          ...jobProtocol.extras,
          hivedScheduler: {
            ...jobProtocol.extras.hivedScheduler,
            taskRoles: {
              ...jobProtocol.extras.hivedScheduler.taskRoles,
              [currentTaskRole]: {
                ...jobProtocol.extras.hivedScheduler.taskRoles[currentTaskRole],
                skuNum: value,
              },
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
      min={SKU_COUNT_MIN}
      step={1}
      value={skuNum}
      onIncrement={debounce(onIncrement)}
      onDecrement={debounce(onDecrement)}
    />
  );
};

export const SKUCount = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureSKUCount);
