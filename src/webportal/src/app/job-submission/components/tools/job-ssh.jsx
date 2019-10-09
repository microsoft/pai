import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { cloneDeep, isEmpty, isNil } from 'lodash';
import { TooltipIcon } from '../controls/tooltip-icon';
import {
  PAI_PLUGIN,
  USERSSH_TYPE_OPTIONS,
  SECRET_PATTERN,
  SSH_KEY_BITS,
} from '../../utils/constants';
import { SSHPlugin } from '../../models/plugin/ssh-plugin';
import SSHGenerator from './ssh-generator';

import {
  DefaultButton,
  Dropdown,
  FontWeights,
  Toggle,
  Stack,
  Text,
  TextField,
  FontSizes,
} from 'office-ui-fabric-react';

const style = {
  headerText: {
    root: {
      fontSize: FontSizes.large,
      fontWeight: FontWeights.semibold,
    },
  },
};

export const JobSSH = ({
  secrets,
  extras,
  onSecretsChange,
  onExtrasChange,
}) => {
  const [sshPlugin, setSshPlugin] = useState(
    SSHPlugin.fromProtocol(extras, secrets),
  );

  useEffect(() => {
    const updatedSSHPlugin = SSHPlugin.fromProtocol(extras, secrets);
    setSshPlugin(updatedSSHPlugin);
  }, [secrets, extras]);

  const _onChangeExtras = useCallback(
    (keyName, propValue) => {
      const updatedSSHPlugin = new SSHPlugin(sshPlugin);
      updatedSSHPlugin[keyName] = propValue;
      setSshPlugin(updatedSSHPlugin);
      const updatedExtras = cloneDeep(extras);
      if (isNil(updatedExtras[PAI_PLUGIN])) {
        updatedExtras[PAI_PLUGIN] = [];
      }
      const pluginBase = updatedExtras[PAI_PLUGIN];
      const oriSshIndex = pluginBase.findIndex(
        plugin => plugin.plugin === 'ssh',
      );
      if (oriSshIndex >= 0) {
        pluginBase[oriSshIndex] = updatedSSHPlugin.convertToProtocolFormat();
        // pluginBase.splice(oriSshIndex);
      } else {
        pluginBase.push(updatedSSHPlugin.convertToProtocolFormat());
      }
      onExtrasChange(updatedExtras);
    },
    [extras],
  );

  const _onChangeSecrets = useCallback(
    (secretRef, value) => {
      const updatedSecrets = cloneDeep(secrets);
      let secretKey = SECRET_PATTERN.exec(secretRef);
      secretKey = isEmpty(secretKey) ? '' : secretKey[1];
      const sshSecret = updatedSecrets.find(secret => secret.key === secretKey);
      if (!isNil(sshSecret)) {
        sshSecret.value = value;
      } else {
        updatedSecrets.push({ key: secretKey, value: value });
      }
      onSecretsChange(updatedSecrets);
    },
    [secrets],
  );

  const _onUsersshTypeChange = useCallback(
    (_, item) => {
      if (item.key === 'custom') {
        _onChangeSecrets(sshPlugin.userssh.value, sshPlugin.secretValue);
        _onChangeExtras('userssh', {
          type: 'custom',
          value: '<% $secrets.sshUserPub %>',
        });
      } else {
        _onChangeExtras('userssh', {
          type: item.key,
          value: '',
        });
      }
    },
    [secrets, _onChangeSecrets, extras, _onChangeExtras],
  );

  const _onUsersshValueChange = useCallback(
    e => {
      if (sshPlugin.userssh.type === 'custom') {
        _onChangeSecrets(sshPlugin.userssh.value, e.target.value);
      } else {
        _onChangeExtras('userssh', {
          ...sshPlugin.userssh,
          value: e.target.value,
        });
      }
    },
    [secrets, _onChangeSecrets, extras, _onChangeExtras],
  );

  const _onUsersshEnable = useCallback(
    (_, checked) => {
      if (!checked) {
        _onChangeExtras('userssh', {});
      } else {
        _onChangeExtras('userssh', {
          type: 'custom',
          value: '<% $secrets.sshUserPub %>',
        });
      }
    },
    [_onChangeExtras],
  );

  const [sshGenerator, setSshGenerator] = useState({ isOpen: false });
  const openSshGenerator = (bits, ev) => {
    setSshGenerator({
      isOpen: true,
      bits: SSH_KEY_BITS,
    });
  };
  const hideSshGenerator = () => {
    setSshGenerator({ isOpen: false });
  };

  const _onSshKeysGenerated = sshKeys => {
    _onChangeSecrets(sshPlugin.userssh.value, sshKeys.public);
  };

  return (
    <Stack gap='m' styles={{ root: { height: '100%' } }}>
      <Stack horizontal gap='s1'>
        <Text styles={style.headerText}>SSH</Text>
        <TooltipIcon
          content={`Choose SSH public key for job. Users should maintain the SSH private key themselves.`}
        />
      </Stack>
      <Stack horizontal gap='s1'>
        <Toggle
          label={'Enable User SSH'}
          inlineLabel={true}
          checked={!isEmpty(sshPlugin.userssh)}
          onChange={_onUsersshEnable}
        />
        <TooltipIcon
          content={
            'Enable User SSH to allow user attach job containers through corresponding ssh private key. You can enter your own ssh pub key or use SSH Key Generator to generate ssh key pair.'
          }
        />
      </Stack>
      {!isEmpty(sshPlugin.userssh) && (
        <Stack horizontal gap='l1'>
          <Dropdown
            placeholder='Select user ssh key type...'
            options={USERSSH_TYPE_OPTIONS}
            onChange={_onUsersshTypeChange}
            selectedKey={sshPlugin.userssh.type}
            disabled={Object.keys(USERSSH_TYPE_OPTIONS).length <= 1}
          />
          <TextField
            placeholder='Enter ssh public key'
            disabled={sshPlugin.userssh.type === 'none'}
            errorMessage={
              isEmpty(sshPlugin.getUserSshValue())
                ? 'Please Enter Valid SSH public key'
                : null
            }
            onChange={_onUsersshValueChange}
            value={sshPlugin.getUserSshValue()}
          />
          <DefaultButton onClick={ev => openSshGenerator(ev)}>
            SSH Key Generator
          </DefaultButton>
          {sshGenerator.isOpen && (
            <SSHGenerator
              isOpen={sshGenerator.isOpen}
              bits={sshGenerator.bits}
              hide={hideSshGenerator}
              onSshKeysChange={_onSshKeysGenerated}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
};

JobSSH.propTypes = {
  secrets: PropTypes.array,
  extras: PropTypes.object,
  onSecretsChange: PropTypes.func.isRequired,
  onExtrasChange: PropTypes.func.isRequired,
};
