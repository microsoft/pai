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

import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { BasicSection } from './basic-section';
import { FormShortSection } from './form-page';
import { DebouncedTextField } from './controls/debounced-text-field';

const TEXT_FILED_REGX = /^[A-Za-z0-9\-._~]+$/;

export const FormTextField = React.memo(props => {
  const {
    sectionLabel,
    onChange,
    sectionOptional,
    sectionTooltip,
    shortStyle,
    value,
  } = props;
  const _onGetErrorMessage = value => {
    const match = TEXT_FILED_REGX.exec(value);
    if (isEmpty(match)) {
      return 'Input is invalid';
    }

    return '';
  };

  const onChangeWrapper = useCallback(
    (_, val) => {
      onChange(val);
    },
    [onChange],
  );

  const textField = (
    <DebouncedTextField
      {...props}
      value={value}
      onChange={onChangeWrapper}
      onGetErrorMessage={_onGetErrorMessage}
    />
  );

  return (
    <BasicSection
      sectionLabel={sectionLabel}
      sectionTooltip={sectionTooltip}
      optional={sectionOptional}
    >
      {shortStyle ? (
        <FormShortSection>{textField}</FormShortSection>
      ) : (
        textField
      )}
    </BasicSection>
  );
});

FormTextField.propTypes = {
  sectionLabel: PropTypes.string.isRequired,
  sectionTooltip: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func,
  value: PropTypes.string,
  sectionOptional: PropTypes.bool,
  shortStyle: PropTypes.bool,
};
