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
    const updatedDeployment = new Deployment(value);
    updatedDeployment[keyName] = newValue;
    if (onChange !== undefined) {
      onChange(updatedDeployment);
    }
  };

  return (
    <BasicSection sectionLabel={'Deployment'} sectionOptional>
      <TextField label={'PreCommands'}
                 value={preCommands}
                 onBlur={(e) => _onChange('preCommands', e.target.value)}
                 multiline
                 rows={3}/>
      <TextField label={'PostCommands'}
                 value={postCommands}
                 multiline
                 rows={3}
                 onBlur={(e) => _onChange('postCommands', e.target.value)}/>
    </BasicSection>
  );
};

DeploymentSection.propTypes = {
  value: PropTypes.instanceOf(Deployment).isRequired,
  onChange: PropTypes.func,
};
