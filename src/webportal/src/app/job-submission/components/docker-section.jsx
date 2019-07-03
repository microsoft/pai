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

import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  TextField,
  DefaultButton,
  Stack,
  PrimaryButton,
  Label,
  StackItem,
  Dropdown,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {DockerInfo} from '../models/docker-info';
import {BasicSection} from './basic-section';
import {FormShortSection} from './form-page';

import {getDockerSectionStyle} from './form-style';
import t from '../../components/tachyons.scss';
import {isEmpty} from 'lodash';

const dockerSectionStyle = getDockerSectionStyle();

const AuthTextFiled = (props) => {
  const {label, value, componentRef, type} = props;
  return (
    <Stack horizontal gap='s1'>
      <StackItem styles={{root: [t.w30]}}>
        <Label>{label}</Label>
      </StackItem>
      <StackItem grow>
        <TextField
          value={value}
          componentRef={componentRef}
          type={type}
          autoComplete='new-password'
        />
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

const options = [
  {
    key: 'all',
    text: 'all-in-one (image: ufoym/deepo:all)',
    image: 'ufoym/deepo:all',
  },
  {
    key: 'tensorflow-gpu-python3.6',
    text: 'tensorflow+python3.6 with gpu (image: ufoym/deepo:tensorflow-py36-cu100)',
    image: 'ufoym/deepo:tensorflow-py36-cu100',
  },
  {
    key: 'tensorflow-cpu',
    text:
      'tensorflow+python3.6 with cpu (image: ufoym/deepo:tensorflow-py36-cpu)',
    image: 'ufoym/deepo:tensorflow-py36-cpu',
  },
  {
    key: 'tensorflow-cpu-python2.7',
    text:
      'tensorflow+python2.7 with cpu (image: ufoym/deepo:tensorflow-py27-cpu)',
    image: 'ufoym/deepo:tensorflow-py27-cpu',
  },
  {
    key: 'pytorch-gpu',
    text: 'pytorch+python3.6 with gpu (image: ufoym/deepo:pytorch-py36-cu100)',
    image: 'ufoym/deepo:pytorch-py36-cu100',
  },
  {
    key: 'pytorch-cpu',
    text: 'pytorch+python3.6 with cpu (image: ufoym/deepo:pytorch-py36-cpu)',
    image: 'ufoym/deepo:pytorch-py36-cpu',
  },
  {
    key: 'customize-image',
    text: 'Customized docker image',
  },
];

function getDockerImageOptionKey(uri) {
  switch (uri) {
    case 'ufoym/deepo:all':
      return 'all';
    case 'ufoym/deepo:tensorflow-py36-cu100':
      return 'tensorflow-gpu-python3.6';
    case 'ufoym/deepo:tensorflow-py36-cpu':
      return 'tensorflow-cpu';
    case 'ufoym/deepo:tensorflow-py27-cpu':
      return 'tensorflow-cpu-python2.7';
    case 'ufoym/deepo:pytorch-py36-cu100':
      return 'pytorch-gpu';
    case 'ufoym/deepo:pytorch-py36-cpu':
      return 'pytorch-cpu';
    default:
      return 'customize-image';
  }
}

export const DockerSection = ({onValueChange, value}) => {
  const {uri, auth} = value;

  const nameInput = useRef(null);
  const password = useRef(null);
  const registryuri = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [showAuth, setShowAuth] = useState(false);
  const [isUseCustomizedDocker, setUseCustomizeDocker] = useState(false);

  const _onChange = useCallback((keyName, propValue) => {
    const updatedDockerInfo = new DockerInfo(value);
    updatedDockerInfo[keyName] = propValue;
    if (onValueChange !== undefined) {
      onValueChange(updatedDockerInfo);
    }
  }, [value, onValueChange]);

  const _onAuthClick = useCallback(() => {
    setShowAuth(true);
  }, []);

  const _onAuthSubmit = useCallback(() => {
    if (
      isEmpty(nameInput.current.value) ||
      isEmpty(password.current.value) ||
      isEmpty(registryuri.current.value)
    ) {
      alert('please input all fileds');
      return;
    }

    setShowAuth(false);
    _onChange('auth', {
      username: nameInput.current.value,
      password: password.current.value,
      registryuri: registryuri.current.value,
    });
  }, [_onChange]);

  const _onUriChange = useCallback((e) => {
    if (!e.target.value) {
      setErrorMsg('Docker should not be empty');
    } else {
      setErrorMsg(null);
    }
    _onChange('uri', e.target.value);
  }, [_onChange]);

  const _onDockerImageChange = useCallback((_, item) => {
    if (item.key == 'customize-image') {
      setUseCustomizeDocker(true);
      _onChange('uri', '');
      return;
    }
    const uri = item.image;
    setUseCustomizeDocker(false);
    _onChange('uri', uri);
  }, [_onChange]);

  useEffect(() => {
    const optionKey = getDockerImageOptionKey(uri);
    if (optionKey === 'customize-image' && !isUseCustomizedDocker) {
      setUseCustomizeDocker(true);
      return;
    }
    if (optionKey !== 'customize-image' && isUseCustomizedDocker) {
      setUseCustomizeDocker(false);
    }
  }, [uri]);

  const _authSection = () => {
    return (
      <Stack
        horizontalAlign='center'
        verticalAlign='center'
        styles={{root: dockerSectionStyle.auth.outerForm}}
      >
        <Stack gap='l1' styles={{root: dockerSectionStyle.auth.innerForm}}>
          <span>Auth</span>
          <Stack gap='m'>
            <AuthTextFiled
              value={auth.username}
              label='username'
              componentRef={nameInput}
            />
            <AuthTextFiled
              value={auth.password}
              label='password'
              type='password'
              componentRef={password}
            />
            <AuthTextFiled
              value={auth.registryuri}
              label='registryuri'
              componentRef={registryuri}
            />
          </Stack>
          <Stack>
            <Stack horizontal gap='m' horizontalAlign='center'>
              <PrimaryButton onClick={_onAuthSubmit}>Submit</PrimaryButton>
              <DefaultButton onClick={() => setShowAuth(false)}>
                Cancel
              </DefaultButton>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    );
  };

  return (
    <BasicSection sectionLabel='Docker image'>
      <FormShortSection>
        <Dropdown
          placeholder='Select a docker image'
          options={options}
          onChange={_onDockerImageChange}
          selectedKey={getDockerImageOptionKey(uri)}
        />
      </FormShortSection>
      {isUseCustomizedDocker && (
        <Stack horizontal gap='l1'>
          <FormShortSection>
            <TextField
              placeholder='Enter docker uri...'
              errorMessage={errorMsg}
              onChange={_onUriChange}
              value={uri}
            />
          </FormShortSection>
          <DefaultButton onClick={_onAuthClick}>Auth</DefaultButton>
        </Stack>
      )}
      {showAuth && _authSection()}
    </BasicSection>
  );
};

DockerSection.propTypes = {
  value: PropTypes.instanceOf(DockerInfo).isRequired,
  auth: PropTypes.object,
  onValueChange: PropTypes.func,
};
