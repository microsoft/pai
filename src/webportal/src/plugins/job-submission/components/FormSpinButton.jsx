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

import React from 'react';
import {SpinButton} from 'office-ui-fabric-react';
import {BasicSection} from './BasicSection';
import PropTypes from 'prop-types';

export const FormSpinButton = (props) => {
  const {label, optional, onChange, value} = props;
  const _onChange = (value) => {
    if (onChange !== undefined) {
      onChange(value);
    }
  };

  const _onIncrement = (value) => _onChange(+value + 1);
  const _onDecrement = (value) => _onChange(+value - 1);
  const _onValidate = (value) => _onChange(value);

  return (
    <BasicSection label={label} optional={optional}>
      <SpinButton min={0}
                  step={1}
                  value={value === undefined ? 0: value}
                  onIncrement={_onIncrement}
                  onDecrement={_onDecrement}
                  onValidate={_onValidate}/>
    </BasicSection>
  );
};

FormSpinButton.propTypes = {
  label: PropTypes.string.isRequired,
  optional: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.string,
};
