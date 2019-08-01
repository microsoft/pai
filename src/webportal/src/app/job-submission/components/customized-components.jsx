/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useCallback } from 'react';
import { SpinButton, Stack } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { debounce, isNil } from 'lodash';
import { TooltipIcon } from './controls/tooltip-icon';

export const CSpinButton = props => {
  const {
    onChange,
    onIncrement,
    onDecrement,
    onValidate,
    min,
    max,
    label,
    tooltip,
  } = props;

  const _onChange = useCallback(
    (value, operateFunc, defaultReturnValue) => {
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
    },
    [onChange],
  );

  const _onIncrement = value => _onChange(value, onIncrement, +value + 1);
  const _onDecrement = value => _onChange(value, onDecrement, +value - 1);
  const _onValidate = value => _onChange(value, onValidate, value);

  return (
    <Stack horizontal gap='s1' verticalAlign='baseline'>
      {label && <div style={{ width: 160 }}>{label}</div>}
      {tooltip && <TooltipIcon content={tooltip} />}
      <SpinButton
        {...props}
        label={null}
        onIncrement={debounce(_onIncrement)}
        onDecrement={debounce(_onDecrement)}
        onValidate={debounce(_onValidate)}
      />
    </Stack>
  );
};

CSpinButton.defaultProps = {
  min: 0,
};

CSpinButton.propTypes = {
  label: PropTypes.string,
  tooltip: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  min: PropTypes.number,
  max: PropTypes.number,
  onChange: PropTypes.func,
  onIncrement: PropTypes.func,
  onDecrement: PropTypes.func,
  onValidate: PropTypes.func,
};
