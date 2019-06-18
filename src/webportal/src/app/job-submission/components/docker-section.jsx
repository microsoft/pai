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

import React, {useState, useRef} from 'react';
import {TextField, DefaultButton, Stack, getId, PrimaryButton, Label, StackItem} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {DockerInfo} from '../models/docker-info';
import {BasicSection} from './basic-section';
import {FormShortSection} from './form-page';
import {getDockerSectionStyle} from './form-style';
import t from '../../components/tachyons.scss';

const dockerSectionStyle = getDockerSectionStyle();

const AuthTextFiled = (props) => {
  const {label, value, componentRef, type} = props;
  return (
    <Stack horizontal gap='s1'>
      <StackItem styles={{root: [t.w30]}}>
        <Label>{label}</Label>
      </StackItem>
      <StackItem grow>
        <TextField value={value} componentRef={componentRef} type={type}/>
      </StackItem>
    </Stack>
  );
};

AuthTextFiled.propTypes = {
  value: PropTypes.string,
  label: PropTypes.string.isRequired,
  componentRef: PropTypes.object,
  type: PropTypes.string,
};

export const DockerSection = (props) => {
  const {onValueChange, value} = props;
  const {uri, auth} = value;

  const nameInput = useRef(null);
  const password = useRef(null);
  const registryuri = useRef(null);

  const textFieldId = getId('textField');

  const [showAuth, setShowAuth] = useState(false);

  const _onChange = (keyName, propValue) => {
    const updatedDockerInfo = new DockerInfo(value);
    updatedDockerInfo[keyName] = propValue;
    if (onValueChange !== undefined) {
      onValueChange(updatedDockerInfo);
    }
  };

  const _onAuthClick = () => {
    setShowAuth(true);
  };

  const _onAuthSubmit = () => {
    setShowAuth(false);
    _onChange('auth', {username: nameInput.current.value,
                       password: password.current.value,
                       registryuri: registryuri.current.value});
  };

  const _authSection = () => {
    return (
      <Stack horizontalAlign='center' verticalAlign='center' styles={{root: dockerSectionStyle.auth.outerForm}}>
        <Stack gap='l1' styles={{root: dockerSectionStyle.auth.innerForm}}>
          <span>Auth</span>
          <Stack gap='m'>
            <AuthTextFiled label='username' value={auth.username} componentRef={nameInput}/>
            <AuthTextFiled label='password' value={auth.username} componentRef={nameInput} type='password'/>
            <AuthTextFiled label='registryuri' value={auth.username} componentRef={nameInput}/>
          </Stack>
          <Stack>
            <Stack horizontal gap='m' horizontalAlign='center'>
              <PrimaryButton onClick={_onAuthSubmit} >Submit</PrimaryButton>
              <DefaultButton onClick={()=>setShowAuth(false)}>Cancel</DefaultButton>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    );
  };

  return (
    <BasicSection sectionLabel={'Docker'}>
      <Stack horizontal gap='l1'>
        <FormShortSection>
          <TextField id={textFieldId}
                     placeholder='Enter docker uri...'
                     onBlur={(event) => _onChange('uri', event.target.value)}
                     value={uri}/>
         </FormShortSection>
        <DefaultButton onClick={_onAuthClick}>Auth</DefaultButton>
      </Stack>
      {showAuth && _authSection()}
    </BasicSection>
  );
};

DockerSection.propTypes = {
  value: PropTypes.instanceOf(DockerInfo).isRequired,
  auth: PropTypes.object,
  onValueChange: PropTypes.func,
};
