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
import {Label, Stack, SpinButton} from 'office-ui-fabric-react';
import {getFromComponentsStyle, marginSize} from './formStyle';
import PropTypes from 'prop-types';
import {BasicSection} from './BasicSection';

const formComponentsStyles = getFromComponentsStyle();

export const Completion= (props) => {
  const {minFailedInstances, minSucceedInstances} = props;
  const formCompeletionStyle = formComponentsStyles.formCompeletion;

  return (
    <BasicSection label={'Completion'} optional>
      <Stack horizontal gap={marginSize.s1} styles={formCompeletionStyle.horizonStack}>
        <Label styles={formCompeletionStyle.label}>minFailedInstances</Label>
        <SpinButton value={minFailedInstances} />
      </Stack>
      <Stack horizontal gap={marginSize.s1} styles={formCompeletionStyle.horizonStack}>
        <Label styles={formCompeletionStyle.label}>minSucceedInstances</Label>
        <SpinButton value={minSucceedInstances} />
      </Stack>
    </BasicSection>
  );
};

Completion.propTypes = {
  minFailedInstances: PropTypes.number,
  minSucceedInstances: PropTypes.number,
};
