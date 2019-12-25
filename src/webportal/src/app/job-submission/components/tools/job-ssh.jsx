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
import { fetchUserSshPublicKey } from '../../utils/conn';

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
  // We have two data sources: expression ssh key and input ssh key
  const [enableSsh, setEnableSsh] = useState(!isEmpty(SSHPlugin.fromProtocol(extras).userssh));
  // Data Source 1: input ssh key
  // Input ssh key is initialized from extras. Thus, it will be kept by cloning jobs.
  const [inputSshPlugin, setInputSshPlugin] = useState(SSHPlugin.fromProtocol(extras));
  // Data Source 2: expression ssh key. `expressionSshState` could be: Init, Fetching, NotFound and Found
  // Expression ssh key will always be initialized.
  const [expressionSshState, setExpressionSshState] = useState('Init')
  const [expressionSshValue, setExpressionSshValue] = useState('')
  const [expressionSshPlugin, setExpressionSshPlugin] = useState(
    new SSHPlugin({
      jobssh: true,
      userssh: {type: 'custom', value: ''}
    }));

  useEffect(() => {
    const updatedSSHPlugin = SSHPlugin.fromProtocol(extras);
    if (expressionSshState === 'Found'){
      setExpressionSshPlugin(updatedSSHPlugin);
    } else {
      setInputSshPlugin(updatedSSHPlugin)
    }
    setEnableSsh(!isEmpty(updatedSSHPlugin.userssh))
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
  }, [extras, expressionSshState, inputSshPlugin, expressionSshPlugin])

  const _updateInputPlugin = useCallback((keyName, propValue) => {
    const updatedSSHPlugin = new SSHPlugin(inputSshPlugin);
    updatedSSHPlugin[keyName] = propValue;
    setInputSshPlugin(updatedSSHPlugin);
    _updateExtras(updatedSSHPlugin)
  }, [inputSshPlugin, _updateExtras]);

  const _updateExpressionPlugin = useCallback((keyName, propValue) => {
    const updatedSSHPlugin = new SSHPlugin(expressionSshPlugin);
    updatedSSHPlugin[keyName] = propValue;
    setExpressionSshPlugin(updatedSSHPlugin);
    _updateExtras(updatedSSHPlugin)
  }, [expressionSshPlugin, _updateExtras]);

  const _onUsersshTypeChange = useCallback(
    (_, item) => {
      _updateInputPlugin('userssh', {
        type: item.key,
        value: '',
      });
    },
    [_updateInputPlugin],
  );

  const _onUsersshValueChange = useCallback(
    e => {
      _updateInputPlugin('userssh', {
        ...inputSshPlugin.userssh,
        value: e.target.value,
      });
    },
    [_updateInputPlugin],
  );


  const _onUsersshEnable = (_, checked) => {
    setEnableSsh(checked)
    // if we have not got expression ssh key, try to fetch it.
    if (expressionSshState === 'Init'){
      setExpressionSshState('Fetching')
      const user = cookies.get('user');
        fetchUserSshPublicKey(user).then((sshPublicKey) => {
          if (sshPublicKey != 'NotFound') {
            setExpressionSshState('Found')
            setExpressionSshValue(sshPublicKey)
            _updateExpressionPlugin('userssh', {
              type: 'custom',
              value: sshPublicKey
            })
          } else {
            setExpressionSshState('NotFound')
          }
      }).catch(err => {
        console.error(err)
        setExpressionSshState('NotFound')
      });
    }
    if (expressionSshState === 'Found'){
      // if we found the expression ssh, use it
      if (!checked){
        _updateExpressionPlugin('userssh', {});
      } else {
        _updateExpressionPlugin('userssh', {
          type: 'custom',
          value: expressionSshValue
        });
      }
    } else {
      // use input ssh key
      if (!checked) {
        _updateInputPlugin('userssh', {});
      } else {
        _updateInputPlugin('userssh', {
          type: 'custom',
          value: '',
        });
      }
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
    _updateInputPlugin('userssh', {
      ...inputSshPlugin.userssh,
      value: sshKeys.public,
    });
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
          checked={enableSsh}
          onChange={_onUsersshEnable}
        />
        <TooltipIcon
          content={
            'Enable User SSH to allow user attach job containers through corresponding ssh private key. You can enter your own ssh pub key or use SSH Key Generator to generate ssh key pair.'
          }
        />
      </Stack>
      { (enableSsh && (expressionSshState === 'Fetching')) && (
        <Stack horizontal>
          <Spinner size={SpinnerSize.large}>Trying to load predefined SSH key...</Spinner>
        </Stack>
      )}
      { (enableSsh && (expressionSshState === 'Found')) && (
        <Stack horizontal>
          <p>Use predefined SSH key.</p>
        </Stack>
      )}
      { (enableSsh && (expressionSshState === 'NotFound' || expressionSshState === 'Init')) && (
        <Stack horizontal gap='l1'>
          <Dropdown
            placeholder='Select user ssh key type...'
            options={USERSSH_TYPE_OPTIONS}
            onChange={_onUsersshTypeChange}
            selectedKey={inputSshPlugin.userssh.type}
            disabled={Object.keys(USERSSH_TYPE_OPTIONS).length <= 1}
          />
          <TextField
            placeholder='Enter ssh public key'
            disabled={inputSshPlugin.userssh.type === 'none'}
            errorMessage={
              isEmpty(inputSshPlugin.getUserSshValue())
                ? 'Please Enter Valid SSH public key'
                : null
            }
            onChange={_onUsersshValueChange}
            value={inputSshPlugin.getUserSshValue()}
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
  extras: PropTypes.object,
  onExtrasChange: PropTypes.func.isRequired,
};
