// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import PropTypes from 'prop-types';
import { FormSpinButton } from '../controls/form-spin-button';
import { Completion } from '../../models/completion';

const SUCCEED_INSTANCES_MIN = -1;

export const MinSucceedInstances = ({ value, onChange }) => {
  const onItemChange = val => {
    onChange(
      'completion',
      new Completion({ ...value, minSucceededInstances: val }),
    );
  };

  return (
    <FormSpinButton
      min={SUCCEED_INSTANCES_MIN}
      step={1}
      value={value.minSucceededInstances}
      onChange={onItemChange}
    />
  );
};

MinSucceedInstances.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
