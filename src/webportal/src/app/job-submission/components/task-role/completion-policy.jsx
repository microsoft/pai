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
import { Stack } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { BasicSection } from '../basic-section';
import { CSpinButton } from '../customized-components';
import { FormShortSection } from '../form-page';
import { Completion } from '../../models/completion';

export const CompletionPolicy = React.memo(({ onChange, value }) => {
  const { minFailedInstances, minSucceededInstances } = value;

  const _onChange = (keyName, newValue) => {
    const completion = new Completion(value);
    completion[keyName] = newValue;
    if (onChange !== undefined) {
      onChange(completion);
    }
  };

  return (
    <BasicSection sectionLabel={'Completion policy'} sectionOptional>
      <FormShortSection gap='m'>
        <Stack horizontal gap='s1'>
          <CSpinButton
            label={'Min Failed Instances'}
            value={minFailedInstances}
            min={-1}
            onChange={v => _onChange('minFailedInstances', v)}
          />
        </Stack>
        <Stack horizontal gap='s1'>
          <CSpinButton
            label={'Min Succeed Instances'}
            value={minSucceededInstances}
            min={-1}
            onChange={v => _onChange('minSucceededInstances', v)}
          />
        </Stack>
      </FormShortSection>
    </BasicSection>
  );
});

CompletionPolicy.propTypes = {
  value: PropTypes.instanceOf(Completion).isRequired,
  onChange: PropTypes.func,
};
