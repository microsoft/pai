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
import {Toggle, Stack, SpinButton} from 'office-ui-fabric-react';
import {marginSize} from './formStyle';
import PropTypes from 'prop-types';
import {BasicSection} from './BasicSection';

export const ContainerSize = (props) => {
  return (
    <BasicSection label={'ContainerSize'}>
      <Stack gap={marginSize.s1}>
        <Stack horizontal>
          <SpinButton label={'GPU count'} styles={{labelWrapper: {width: '20%'}, root: {width: '80%'}}}/>
          <Toggle defaultChecked={false} label='Custom' inlineLabel={true} styles={{label: {order: -1, marginRight: '4px'}}}/>
        </Stack>
        <SpinButton label={'CPU count'} styles={{labelWrapper: {width: '20%'}, root: {width: '80%'}}}/>
        <SpinButton label={'Memory (MB)'} styles={{labelWrapper: {width: '20%'}, root: {width: '80%'}}}/>
        <SpinButton label={'Shared memory (MB)'} styles={{labelWrapper: {width: '20%'}, root: {width: '80%'}}}/>
      </Stack>
    </BasicSection>
  );
};

ContainerSize.propTypes = {
  minFailedInstances: PropTypes.number,
  minSucceedInstances: PropTypes.number,
};
