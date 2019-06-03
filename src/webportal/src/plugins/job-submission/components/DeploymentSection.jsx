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
import {TextField} from 'office-ui-fabric-react';
import {BasicSection} from './BasicSection';
import PropTypes from 'prop-types';
import {Deployment} from '../models/deployment';

export const DeploymentSection = (props) => {
  const {onChange, value} = props;
  const {preCommands, postCommands} = value;

  const _onChange = (keyName, newValue) => {
    if (onChange === undefined) {
      return;
    }
    const deployment = new Deployment(value);
    deployment[keyName] = newValue;
    onChange(deployment);
  };

  return (
    <BasicSection sectionLabel={'Deployment'} sectionOptional>
      <TextField label={'PreCommands'}
                 value={preCommands}
                 onChange={(_, v)=>_onChange('preCommands', v)}
                 multiline
                 rows={3}/>
      <TextField label={'PostCommands'}
                 value={postCommands}
                 multiline
                 rows={3}
                 onChange={(_, v)=>_onChange('postCommands', v)}/>
    </BasicSection>
  );
};

DeploymentSection.propTypes = {
  value: PropTypes.instanceOf(Deployment).isRequired,
  onChange: PropTypes.func,
};
