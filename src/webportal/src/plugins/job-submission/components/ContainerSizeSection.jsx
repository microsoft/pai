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

import React, {useState} from 'react';
import {getTheme, Toggle, Stack} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {BasicSection} from './BasicSection';
import {ContainerSize} from '../models/containerSize';
import {CSpinButton} from './CustomizedComponents';

const {spacing} = getTheme();

export const ContainerSizeSection = (props) => {
  const {defaultValue, onChange, isContainerSizeEnabled, onEnable} = props;
  const [value, setValue] = useState(defaultValue);
  const {cpu, memoryMB, gpu, shmMB} = value;

  const _onChange = (keyName, newValue) => {
    const containerSize = new ContainerSize(value);
    containerSize[keyName] = newValue;
    if (onChange !== undefined) {
      onChange(containerSize);
    }
    setValue(containerSize);
  };

  const _onEnable = (_, checked) => {
    if (onEnable === undefined) {
      return;
    }
    onEnable(checked);
  };

  return (
    <BasicSection sectionLabel={'ContainerSize'}>
      <Stack horizontal>
        <CSpinButton label={'GPU count'}
                      value={gpu}
                      onChange={(value)=>_onChange('gpu', value)}/>
        <Toggle checked={isContainerSizeEnabled}
                label='Custom'
                inlineLabel={true}
                styles={{label: {order: -1, marginRight: spacing.s2}}}
                onChange={_onEnable}/>
      </Stack>
      <CSpinButton label={'CPU count'}
                   disabled={!isContainerSizeEnabled}
                   value={cpu}
                   onChange={(value)=>_onChange('cpu', value)}/>
      <CSpinButton label={'Memory (MB)'}
                   disabled={!isContainerSizeEnabled}
                   value={memoryMB}
                   onChange={(value)=>_onChange('memoryMB', value)}/>
      <CSpinButton label={'Shared memory (MB)'}
                   value={shmMB}
                   disabled={!isContainerSizeEnabled}
                   onChange={(value)=>_onChange('shmMB', value)}/>
    </BasicSection>
  );
};

ContainerSizeSection.propTypes = {
  defaultValue: PropTypes.instanceOf(ContainerSize).isRequired,
  onChange: PropTypes.func,
  isContainerSizeEnabled: PropTypes.bool,
  onEnable: PropTypes.func,
};
