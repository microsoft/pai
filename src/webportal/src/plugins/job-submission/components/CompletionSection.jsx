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
import {Stack, SpinButton} from 'office-ui-fabric-react';
import {marginSize} from './formStyle';
import PropTypes from 'prop-types';
import {BasicSection} from './BasicSection';
import {Completion} from '../models/completion';

export const CompletionSection= (props) => {
  const {onChange, value} = props;
  const {minFailedInstances, minSuceedInstances} = value;

  const _onCompletionChange = (oriValue, keyName, newValue) => {
    if (onChange === undefined) {
      return;
    }
    const completion = new Completion(oriValue);
    completion[keyName] = newValue;
    onChange(completion);
  };

  const _onChange = _onCompletionChange.bind(null, value);

  const _onIncrement = (keyName, value) => _onChange(keyName, +value + 1);
  const _onDecrement = (keyName, value) => _onChange(keyName, +value - 1);
  const _onValidate = (keyName, value) => _onChange(keyName, value);

  return (
    <BasicSection label={'Completion'} optional>
      <Stack horizontal gap={marginSize.s1}>
        <SpinButton label={'Min Failed Instances'}
                    value={minFailedInstances === undefined? NaN.toString() : minFailedInstances}
                    onIncrement={(v) => _onIncrement('minFailedInstances', v)}
                    onDecrement={(v) => _onDecrement('minFailedInstances', v)}
                    onValidate={(v) => _onValidate('minFailedInstances', v)}
                    styles={{labelWrapper: {width: '20%'}, root: {width: '80%'}}}/>
      </Stack>
      <Stack horizontal gap={marginSize.s1}>
        <SpinButton label={'Min Succeed Instances'}
                    value={minSuceedInstances === undefined? NaN.toString() : minSuceedInstances}
                    onIncrement={(v) => _onIncrement('minSuceedInstances', v)}
                    onDecrement={(v) => _onDecrement('minSuceedInstances', v)}
                    onValidate={(v) => _onValidate('minSuceedInstances', v)}
                    styles={{labelWrapper: {width: '20%'}, root: {width: '80%'}}}/>
      </Stack>
    </BasicSection>
  );
};

CompletionSection.propTypes = {
  value: PropTypes.instanceOf(Completion).isRequired,
  onChange: PropTypes.func,
};
