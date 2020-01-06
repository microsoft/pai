import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { cloneDeep, isEmpty, isNil } from 'lodash';
import { TooltipIcon } from '../controls/tooltip-icon';
import {
  PAI_PLUGIN,
  USERSSH_TYPE_OPTIONS,
  SSH_KEY_BITS,
} from '../../utils/constants';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
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


export const JobSSH = ({ extras, onExtrasChange }) => {
  // Decouple toggle logic from ssh data source
  const [enableSsh, setEnableSsh] = useState(SSHPlugin.fromProtocol(extras).enable);
  const [inputSshPlugin, setInputSshPlugin] = useState(SSHPlugin.fromProtocol(extras));


  useEffect(() => {
    const updatedSSHPlugin = SSHPlugin.fromProtocol(extras);
    setInputSshPlugin(updatedSSHPlugin)
    setEnableSsh(updatedSSHPlugin.enable)
  }, [extras]);

  // We do not use a `useEffect` here, since it will cause infinite loop to update `extras`.
  const _updateExtras = useCallback((sshPlugin) => {
    const updatedExtras = cloneDeep(extras);
    if (isNil(updatedExtras[PAI_PLUGIN])) {
      updatedExtras[PAI_PLUGIN] = [];
    }
    const pluginBase = updatedExtras[PAI_PLUGIN];
    const oriSshIndex = pluginBase.findIndex(
      plugin => plugin.plugin === 'ssh',
    );
    if (oriSshIndex >= 0) {
      pluginBase[oriSshIndex] = sshPlugin.convertToProtocolFormat();
    } else {
      pluginBase.push(sshPlugin.convertToProtocolFormat());
    }
    onExtrasChange(updatedExtras);
  }, [extras, inputSshPlugin])

  const _updateInputPlugin = useCallback((updatedKV) => {
    const updatedSSHPlugin = new SSHPlugin(inputSshPlugin);
    for (let keyName in updatedKV){
      updatedSSHPlugin[keyName] = updatedKV[keyName]
    }
    setInputSshPlugin(updatedSSHPlugin);
    _updateExtras(updatedSSHPlugin)
  }, [inputSshPlugin, _updateExtras]);

  const _onUsersshTypeChange = useCallback(
    (_, item) => {
      _updateInputPlugin({'userssh': {
        type: item.key,
        value: '',
      }});
    },
    [_updateInputPlugin],
  );

  const _onUsersshValueChange = useCallback(
    e => {
      _updateInputPlugin({'userssh': {
        ...inputSshPlugin.userssh,
        value: e.target.value,
      }});
    },
    [_updateInputPlugin],
  );


  const _onUsersshEnable = (_, checked) => {
    setEnableSsh(checked)
    if (!checked) {
      _updateInputPlugin({'userssh': {}, 'enable': false});
    } else {
      _updateInputPlugin({
        'userssh': {
          type: 'custom',
          value: '',
        },
        'enable': true});
    }
  }

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
    _updateInputPlugin({'userssh': {
      ...inputSshPlugin.userssh,
      value: sshKeys.public,
    }});
  };


  return (
    <Stack gap='m' styles={{ root: { height: '100%' } }}>
      <Stack horizontal gap='s1'>
        <Text styles={style.headerText}>SSH</Text>
        <TooltipIcon
          content={`Choose SSH public key for job. Users should maintain the SSH private key themselves.`}
        />
      </Stack>
      <Stack gap='s1'>
        <Stack horizontal gap='s1'>
          <Toggle
            label={'Enable User SSH'}
            inlineLabel={true}
            checked={enableSsh}
            onChange={_onUsersshEnable}
          />
          <TooltipIcon
            content={
              'Enable User SSH to allow user attach job containers through corresponding ssh private key. You can enter your own ssh pub key or use SSH Key Generator to generate ssh key pair.'
            }
          />
        </Stack>
        { (enableSsh) && (
        <Text>Your pre-defined SSH public keys on the <a href="/user-profile.html" target="_blank" >User Profile</a> page will be set automatically.</Text>
        )}
      </Stack>

      { (enableSsh ) && (
        <Stack gap='s1'>
          <Text>Add additional SSH key:</Text>
          <Stack horizontal gap='l1'>
            <TextField
              placeholder='Additional ssh public key'
              disabled={inputSshPlugin.userssh.type === 'none'}
              errorMessage={null}
              onChange={_onUsersshValueChange}
              value={inputSshPlugin.getUserSshValue()}
              styles={{ fieldGroup: { width: 300 } }}
            />
            <DefaultButton onClick={ev => openSshGenerator(ev)}>
              Generator
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
        </Stack>
      )}
    </Stack>
  );
};

JobSSH.propTypes = {
  extras: PropTypes.object,
  onExtrasChange: PropTypes.func.isRequired,
};
