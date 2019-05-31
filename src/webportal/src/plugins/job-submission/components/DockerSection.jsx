/*!
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
import { TextField, DefaultButton, Stack } from 'office-ui-fabric-react';
import { getId } from 'office-ui-fabric-react/lib/Utilities'
import { getFromComponentsStyle, marginSize } from './formStyle';
import PropTypes from 'prop-types';
import { DockerInfo } from '../models/dockerInfo'
import { BasicSection } from './BasicSection';

const formComponentsStyles = getFromComponentsStyle();

export const DockerSection = (props) => {
  const textFieldId = getId('textField');
  const { onValueChange, dockerInfo } = props;

  const onDockerUriChange = (_, value) => {
    if (onValueChange == undefined) {
      return;
    }

    const dockerInfo = new DockerInfo();
    dockerInfo.uri = value;
    onValueChange(dockerInfo);
  };

  return (
    <BasicSection label={'Docker'}>
    {/* TODO: remove hard code width here */}
    <Stack horizontal gap={marginSize.s2} styles={{root: {width: '85%'}}} >
      <TextField id={textFieldId}
                   placeholder='Enter docker uri...'
                   styles={formComponentsStyles.textFiled}
                   onChange={onDockerUriChange}
                   value={dockerInfo.uri}/>
      <DefaultButton>Auth</DefaultButton>
    </Stack>
  </BasicSection>
  );
}

DockerSection.propTypes = {
  dockerInfo: PropTypes.instanceOf(DockerInfo).isRequired,
  onValueChange: PropTypes.func,
};