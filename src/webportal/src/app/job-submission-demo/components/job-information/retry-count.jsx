// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { SpinButton } from 'office-ui-fabric-react';
import { debounce, get } from 'lodash';
import PropTypes from 'prop-types';

const RETRY_COUNT_MIN = 0;

const PureRetryCount = ({ dispatch, jobProtocol }) => {
  const jobRetryCount = get(jobProtocol, 'jobRetryCount', 0);

  const onChange = value => {
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
        ...jobProtocol,
        jobRetryCount: Math.max(RETRY_COUNT_MIN, value),
      },
    });
  };

  const onIncrement = value => onChange(+value + 1);
  const onDecrement = value => onChange(+value - 1);

  return (
    <SpinButton
      min={RETRY_COUNT_MIN}
      step={1}
      value={jobRetryCount}
      onIncrement={debounce(onIncrement, 200)}
      onDecrement={debounce(onDecrement, 200)}
    />
  );
};

export const RetryCount = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
}))(PureRetryCount);

PureRetryCount.propTypes = {
  dispatch: PropTypes.func,
  jobProtocol: PropTypes.object,
};
