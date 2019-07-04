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

import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {TextField} from 'office-ui-fabric-react';
import {BasicSection} from './basic-section';
import {FormShortSection} from './form-page';

import PropTypes from 'prop-types';
import {debounce, isEmpty} from 'lodash';

const TEXT_FILED_REGX = /^[A-Za-z0-9\-._~]+$/;

export const FormTextField = React.memo((props) => {
  const {sectionLabel, onChange, sectionOptional, sectionTooltip, shortStyle, value} = props;
  const [cachedValue, setCachedValue] = useState('');
  useEffect(() => setCachedValue(value), [value]);
  const _onGetErrorMessage = (value) => {
    const match = TEXT_FILED_REGX.exec(value);
    if (isEmpty(match)) {
      return 'Input is invalid';
    }
    return '';
  };

  const debouncedOnChange = useMemo(() => debounce(onChange, 200), [onChange]);

  const onChangeWrapper = useCallback(
    (_, val) => {
      setCachedValue(val);
      debouncedOnChange(val);
    },
    [setCachedValue, debouncedOnChange],
  );

  const textField = (
    <TextField
      {...props}
      value={cachedValue}
      onChange={onChangeWrapper}
      onGetErrorMessage={_onGetErrorMessage}
    />
  );

  return (
    <BasicSection sectionLabel={sectionLabel} sectionTooltip={sectionTooltip} optional={sectionOptional}>
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
  sectionTooltip: PropTypes.node,
  onChange: PropTypes.func,
  value: PropTypes.string,
  sectionOptional: PropTypes.bool,
  shortStyle: PropTypes.bool,
};
