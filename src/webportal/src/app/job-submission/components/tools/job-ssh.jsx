import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { cloneDeep, isEmpty, isNil } from 'lodash';
import { TooltipIcon } from '../controls/tooltip-icon';
import {
  PAI_PLUGIN,
  SSH_KEY_BITS,
  PROTOCOL_TOOLTIPS,
} from '../../utils/constants';
import { Hint } from '../sidebar/hint';
import { SSHPlugin } from '../../models/plugin/ssh-plugin';
import SSHGenerator from './ssh-generator';

import {
  DefaultButton,
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
  const [sshPlugin, setSshPlugin] = useState(SSHPlugin.fromProtocol(extras));

  useEffect(() => {
    const updatedSSHPlugin = SSHPlugin.fromProtocol(extras);
    setSshPlugin(updatedSSHPlugin);
  }, [extras]);

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
      } else {
        pluginBase.push(updatedSSHPlugin.convertToProtocolFormat());
      }
      onExtrasChange(updatedExtras);
    },
    [extras],
  );

  const _onUsersshValueChange = useCallback(
    e => {
      _onChangeExtras('userssh', {
        ...sshPlugin.userssh,
        value: e.target.value,
      });
    },
    [extras, _onChangeExtras],
  );

  const _onUsersshEnable = useCallback(
    (_, checked) => {
      if (!checked) {
        _onChangeExtras('userssh', {});
      } else {
        _onChangeExtras('userssh', {
          type: 'custom',
          value: '',
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
    _onChangeExtras('userssh', {
      ...sshPlugin.userssh,
      value: sshKeys.public,
    });
  };

  return (
    <Stack gap='m' styles={{ root: { height: '100%' } }}>
      <Stack horizontal verticalAlign='baseline'>
        <Text styles={style.headerText}>SSH</Text>
        <TooltipIcon content={PROTOCOL_TOOLTIPS.ssh} />
      </Stack>
      <Toggle
        label={'Enable User SSH'}
        inlineLabel={true}
        checked={!isEmpty(sshPlugin.userssh)}
        onChange={_onUsersshEnable}
      />
      {!isEmpty(sshPlugin.userssh) && (
        <Stack gap='l1'>
          <Hint>
            Your pre-defined SSH public keys on the{' '}
            <a href='/user-profile.html'>User Profile</a> page will be set
            automatically.
          </Hint>
          <Stack horizontal gap='l1'>
            <TextField
              Lable='Add additional SSH public key'
              placeholder='Additional SSH public key'
              disabled={sshPlugin.userssh.type === 'none'}
              onChange={_onUsersshValueChange}
              value={sshPlugin.getUserSshValue()}
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
