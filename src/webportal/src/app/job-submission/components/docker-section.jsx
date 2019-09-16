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

import React, { useState, useRef, useCallback } from 'react';
import {
  TextField,
  DefaultButton,
  Stack,
  PrimaryButton,
  Label,
  StackItem,
  Dropdown,
  Toggle,
  getTheme,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { DockerInfo } from '../models/docker-info';
import { BasicSection } from './basic-section';
import { FormShortSection } from './form-page';

import { getDockerSectionStyle } from './form-style';
import t from '../../components/tachyons.scss';
import { isEmpty } from 'lodash';
import { DOCKER_OPTIONS, DEFAULT_DOCKER_URI } from '../utils/constants';

const { spacing } = getTheme();
const dockerSectionStyle = getDockerSectionStyle();

const AuthTextFiled = props => {
  const { label, value, componentRef, type } = props;
  return (
    <Stack horizontal gap='s1'>
      <StackItem styles={{ root: [t.w30] }}>
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

function getDockerImageOptionKey(uri) {
  const dockerOption = DOCKER_OPTIONS.find(
    dockerOption => dockerOption.image === uri,
  );
  if (isEmpty(dockerOption)) {
    return 'customize-image';
  }
  return dockerOption.key;
}

export const DockerSection = ({ sectionTooltip, onValueChange, value }) => {
  const { uri, auth, isUseCustomizedDocker } = value;

  const nameInput = useRef(null);
  const password = useRef(null);
  const registryuri = useRef(null);

  const [showAuth, setShowAuth] = useState(false);

  const _onChange = useCallback(
    (keyName, propValue) => {
      const updatedDockerInfo = new DockerInfo(value);
      updatedDockerInfo[keyName] = propValue;
      if (onValueChange !== undefined) {
        onValueChange(updatedDockerInfo);
      }
    },
    [value, onValueChange],
  );

  const _onPropertiesChange = useCallback(
    updateProperties => {
      let updatedDockerInfo = { ...value, ...updateProperties };
      updatedDockerInfo = new DockerInfo(updatedDockerInfo);
      if (onValueChange !== undefined) {
        onValueChange(updatedDockerInfo);
      }
    },
    [value, onValueChange],
  );

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

  const _onUriChange = useCallback(
    e => {
      _onChange('uri', e.target.value);
    },
    [_onChange],
  );

  const _onDockerImageChange = useCallback(
    (_, item) => {
      const uri = item.image;
      _onChange('uri', uri);
    },
    [_onChange],
  );

  const _onCutomizedImageEnable = useCallback(
    (_, checked) => {
      if (!checked) {
        _onPropertiesChange({
          uri: DEFAULT_DOCKER_URI,
          isUseCustomizedDocker: checked,
        });
      } else {
        _onChange('isUseCustomizedDocker', checked);
      }
    },
    [_onChange, _onPropertiesChange],
  );

  const _authSection = () => {
    return (
      <Stack
        horizontalAlign='center'
        verticalAlign='center'
        styles={{ root: dockerSectionStyle.auth.outerForm }}
      >
        <Stack gap='l1' styles={{ root: dockerSectionStyle.auth.innerForm }}>
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
    <BasicSection sectionLabel='Docker image' sectionTooltip={sectionTooltip}>
      <Stack horizontal gap='l1'>
        <FormShortSection>
          <Dropdown
            placeholder='Select a docker image'
            options={DOCKER_OPTIONS}
            onChange={_onDockerImageChange}
            selectedKey={getDockerImageOptionKey(uri)}
            disabled={isUseCustomizedDocker}
          />
        </FormShortSection>
        <Stack horizontalAlign='start'>
          <Toggle
            checked={isUseCustomizedDocker}
            label='Custom'
            inlineLabel={true}
            styles={{
              label: { order: -1, marginLeft: 0, marginRight: spacing.s1 },
            }}
            onChange={_onCutomizedImageEnable}
          />
        </Stack>
      </Stack>
      {isUseCustomizedDocker && (
        <Stack horizontal gap='l1'>
          <FormShortSection>
            <TextField
              placeholder='Enter docker uri...'
              errorMessage={isEmpty(uri) ? 'Docker should not be empty' : null}
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
  sectionTooltip: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  auth: PropTypes.object,
  onValueChange: PropTypes.func,
};
