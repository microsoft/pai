// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import PropTypes from 'prop-types';
import { FormSpinButton } from '../controls/form-spin-button';

const RETRY_COUNT_MIN = 0;

export const TaskRetryCount = ({ value, onChange }) => {
  const onItemChange = value => {
    onChange('taskRetryCount', value);
  };

  return (
    <FormSpinButton
      min={RETRY_COUNT_MIN}
      step={1}
      value={value}
      onChange={onItemChange}
    />
  );
};

TaskRetryCount.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
