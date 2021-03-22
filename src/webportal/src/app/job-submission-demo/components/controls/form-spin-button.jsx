// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SpinButton } from 'office-ui-fabric-react';
import React from 'react';
import { debounce, isNil } from 'lodash';
import PropTypes from 'prop-types';

export const FormSpinButton = props => {
  const { min, max, onChange, onIncrement, onDecrement, onValidate } = props;

  const _onChange = (value, operateFunc, defaultReturnValue) => {
    let newValue = defaultReturnValue;
    if (!isNil(min)) {
      newValue = Math.max(min, newValue);
    }
    if (!isNil(max)) {
      newValue = Math.min(max, newValue);
    }
    if (operateFunc !== undefined) {
      newValue = operateFunc(value);
    }
    if (onChange === undefined) {
      return newValue;
    }
    return onChange(newValue);
  };

  const _onIncrement = value => _onChange(value, onIncrement, +value + 1);
  const _onDecrement = value => _onChange(value, onDecrement, +value - 1);
  const _onValidate = value => _onChange(value, onValidate, value);

  return (
    <SpinButton
      {...props}
      onIncrement={debounce(_onIncrement)}
      onDecrement={debounce(_onDecrement)}
      onValidate={debounce(_onValidate)}
    />
  );
};

FormSpinButton.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.func,
  onIncrement: PropTypes.func,
  onDecrement: PropTypes.func,
  onValidate: PropTypes.func,
};
