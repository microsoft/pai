// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import PropTypes from 'prop-types';
import { FormSpinButton } from '../controls/form-spin-button';

const TASK_ROLE_INSTANCES_MIN = 0;

export const Instances = ({ value, onChange }) => {
  const onItemChange = value => {
    onChange('instances', value);
  };

  return (
    <FormSpinButton
      min={TASK_ROLE_INSTANCES_MIN}
      step={1}
      value={value}
      onChange={onItemChange}
    />
  );
};

Instances.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
