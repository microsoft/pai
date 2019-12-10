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
import { getTheme, Toggle, Stack } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { BasicSection } from './basic-section';
import { getDefaultContainerSize } from '../models/container-size';
import { CSpinButton } from './customized-components';
import { FormShortSection } from './form-page';
import { PROTOCOL_TOOLTIPS } from '../utils/constants';

const { spacing } = getTheme();

export const ContainerSizeSection = props => {
  const { value, onChange, isContainerSizeEnabled, onEnable } = props;
  const { cpu, memoryMB, gpu } = value;

  const _onChange = (keyName, newValue) => {
    if (onChange !== undefined) {
      onChange({ ...value, [keyName]: newValue });
    }
  };

  const _onEnable = (_, checked) => {
    if (onEnable === undefined) {
      return;
    }
    onEnable(checked);
  };

  const _onGPUSkuChange = gpuNumber => {
    if (onChange !== undefined) {
      onChange(getDefaultContainerSize(gpuNumber));
    }
  };

  return (
    <BasicSection
      sectionLabel='Resources'
      sectionTooltip={PROTOCOL_TOOLTIPS.taskRoleContainerSize}
    >
      <Stack horizontal gap='l1'>
        <FormShortSection gap='m'>
          <CSpinButton
            label='GPU count'
            value={gpu}
            min={0}
            onChange={
              isContainerSizeEnabled
                ? value => _onChange('gpu', value)
                : _onGPUSkuChange
            }
          />
          <CSpinButton
            label={'CPU vcore count'}
            disabled={!isContainerSizeEnabled}
            value={cpu}
            onChange={value => _onChange('cpu', value)}
          />
          <CSpinButton
            label={'Memory (MB)'}
            disabled={!isContainerSizeEnabled}
            value={memoryMB}
            onChange={value => _onChange('memoryMB', value)}
          />
        </FormShortSection>
        <Stack horizontalAlign='start'>
          <Toggle
            checked={isContainerSizeEnabled}
            label='Custom'
            inlineLabel={true}
            styles={{
              label: { order: -1, marginLeft: 0, marginRight: spacing.s1 },
            }}
            onChange={_onEnable}
          />
        </Stack>
      </Stack>
    </BasicSection>
  );
};

ContainerSizeSection.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  isContainerSizeEnabled: PropTypes.bool,
  onEnable: PropTypes.func,
};
