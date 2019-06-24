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
import {getTheme, Toggle, Stack} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {BasicSection} from './basic-section';
import {ContainerSize} from '../models/container-size';
import {CSpinButton} from './customized-components';
import {getSpinButtonStyle} from './form-style';
import {FormShortSection} from './form-page';

const {spacing} = getTheme();
const spinButtonStyle = getSpinButtonStyle();

const skuUnit = {
  gpu: 1,
  cpu: 4,
  memoryMB: 8192,
};

export const ContainerSizeSection = (props) => {
  const {value, onChange, isContainerSizeEnabled, onEnable} = props;
  const {cpu, memoryMB, gpu, shmMB} = value;

  const _onChange = (keyName, newValue) => {
    const containerSize = new ContainerSize(value);
    containerSize[keyName] = newValue;
    if (onChange !== undefined) {
      onChange(containerSize);
    }
  };

  const _onEnable = (_, checked) => {
    if (onEnable === undefined) {
      return;
    }
    onEnable(checked);
  };

  const _onGPUSkuChange= (gpuNumber) => {
    let factor = Number(gpuNumber);
    if (factor <= 0) {
      factor = 1;
    }

    const containerSize = new ContainerSize({
      gpu: skuUnit.gpu * factor,
      cpu: skuUnit.cpu * factor,
      memoryMB: skuUnit.memoryMB * factor,
    });
    if (onChange !== undefined) {
      onChange(containerSize);
    }
  };

  return (
    <BasicSection sectionLabel={'ContainerSize'}>
      <Stack horizontal gap='l1'>
        <FormShortSection gap='m'>
          <CSpinButton
            label={'GPU count'}
            value={gpu}
            styles={spinButtonStyle}
            onChange={
              isContainerSizeEnabled
                ? (value) => _onChange('gpu', value)
                : _onGPUSkuChange
            }
          />
          <CSpinButton
            label={'CPU count'}
            disabled={!isContainerSizeEnabled}
            value={cpu}
            styles={spinButtonStyle}
            onChange={(value) => _onChange('cpu', value)}
          />
          <CSpinButton
            label={'Memory (MB)'}
            disabled={!isContainerSizeEnabled}
            value={memoryMB}
            styles={spinButtonStyle}
            onChange={(value) => _onChange('memoryMB', value)}
          />
          <CSpinButton
            label={'Shared memory (MB)'}
            value={shmMB}
            disabled={!isContainerSizeEnabled}
            styles={spinButtonStyle}
            onChange={(value) => _onChange('shmMB', value)}
          />
        </FormShortSection>
        <Stack horizontalAlign='start'>
          <Toggle
            checked={isContainerSizeEnabled}
            label='Custom'
            inlineLabel={true}
            styles={{
              label: {order: -1, marginLeft: 0, marginRight: spacing.s1},
            }}
            onChange={_onEnable}
          />
        </Stack>
      </Stack>
    </BasicSection>
  );
};

ContainerSizeSection.propTypes = {
  value: PropTypes.instanceOf(ContainerSize).isRequired,
  onChange: PropTypes.func,
  isContainerSizeEnabled: PropTypes.bool,
  onEnable: PropTypes.func,
};
