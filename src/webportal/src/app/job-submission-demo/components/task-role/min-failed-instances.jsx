// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import PropTypes from 'prop-types';
import { FormSpinButton } from '../controls/form-spin-button';
import { Completion } from '../../models/completion';

const FAILED_INSTANCES_MIN = -1;

export const MinFailedInstances = ({ value, onChange }) => {
  const onItemChange = val => {
    onChange(
      'completion',
      new Completion({ ...value, minFailedInstances: val }),
    );
  };

  return (
    <FormSpinButton
      min={FAILED_INSTANCES_MIN}
      step={1}
      value={value.minFailedInstances}
      onChange={onItemChange}
    />
  );
};

MinFailedInstances.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
