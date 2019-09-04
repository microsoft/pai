import React, {useEffect, useState, useCallback} from 'react';
import PropTypes from 'prop-types';
import {cloneDeep, isEmpty, isNil} from 'lodash';
import {Hint} from '../sidebar/hint';
import {TooltipIcon} from '../controls/tooltip-icon';
import {PAI_PLUGIN, USERSSH_TYPE_OPTIONS, SECRET_PATTERN} from '../../utils/constants';
import {SSHPlugin} from '../../models/plugin/ssh-plugin';

import {
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

export const JobSSH = ({secrets, extras, onSecretsChange, onExtrasChange}) => {
  const [sshPlugin, setSshPlugin] = useState(SSHPlugin.fromProtocol(extras, secrets));

  useEffect(() => {
    const updatedSSHPlugin = SSHPlugin.fromProtocol(extras, secrets);
    setSshPlugin(updatedSSHPlugin);
  }, [secrets, extras]);

  const _onChangeExtras = useCallback((keyName, propValue) => {
    const updatedSSHPlugin = new SSHPlugin(sshPlugin);
    updatedSSHPlugin[keyName] = propValue;
    setSshPlugin(updatedSSHPlugin);
    const updatedExtras = cloneDeep(extras);
    if (!updatedExtras.hasOwnProperty(PAI_PLUGIN)) {
      updatedExtras[PAI_PLUGIN] = [];
    }
    const pluginBase = updatedExtras[PAI_PLUGIN];
    const oriSshIndex = pluginBase.findIndex((plugin) => plugin['plugin'] === 'ssh');
    if (oriSshIndex >= 0) {
      pluginBase[oriSshIndex] = updatedSSHPlugin.convertToProtocolFormat();
      // pluginBase.splice(oriSshIndex);
    } else {
      pluginBase.push(updatedSSHPlugin.convertToProtocolFormat());
    }
    onExtrasChange(updatedExtras);
  }, [extras]);

  const _onChangeSecrets = useCallback((secretRef, value) => {
    const updatedSecrets = cloneDeep(secrets);
    let secretKey = SECRET_PATTERN.exec(secretRef);
    secretKey = isEmpty(secretKey) ? '' : secretKey[1];
    const sshSecret = updatedSecrets.find((secret) => secret.key === secretKey);
    if (!isNil(sshSecret)) {
      sshSecret.value = value;
    } else {
      updatedSecrets.push({key: secretKey, value: value});
    }
    onSecretsChange(updatedSecrets);
  }, [secrets]);

  const _onUsersshTypeChange = useCallback((_, item) => {
    if (item.key === 'custom') {
      _onChangeSecrets(sshPlugin.userssh.value, sshPlugin.secretValue);
      _onChangeExtras('userssh', {
        'type': 'custom',
        'value': '<% $secrets.sshUserPub %>',
      });
    } else {
      _onChangeExtras('userssh', {
        'type': item.key,
        'value': '',
      });
    }
  }, [secrets, _onChangeSecrets, extras, _onChangeExtras]);

  const _onUsersshValueChange = useCallback((e) => {
    if (sshPlugin.userssh.type === 'custom') {
      _onChangeSecrets(sshPlugin.userssh.value, e.target.value);
    } else {
      _onChangeExtras('userssh', {
        ...sshPlugin.userssh,
        'value': e.target.value,
      });
    }
  }, [secrets, _onChangeSecrets, extras, _onChangeExtras]);

  const _onUsersshEnable = useCallback((_, checked) => {
    if (!checked) {
      _onChangeExtras('userssh', {});
    } else {
      _onChangeExtras('userssh', {
        'type': 'custom',
        'value': '<% $secrets.sshUserPub %>',
      });
    }
  }, [_onChangeExtras]);

  return (
    <Stack gap='m' styles={{root: {height: '100%'}}}>
      <Stack horizontal gap='s1'>
        <Text styles={style.headerText}>SSH</Text>
        <TooltipIcon content={
          `Choose SSH public key for job. Users should maintain the SSH private key themselves.`
        }
        />
      </Stack>
      <Hint>
        Enable Users SSH to allow user attach job containers through corresponding ssh private key.
      </Hint>
      <Toggle
        label='Enable Job SSH'
        inlineLabel={true}
        checked={sshPlugin.jobssh === true}
        onChange={(ev, isChecked) => {
          _onChangeExtras('jobssh', isChecked);
        }}
      />
      <Toggle
        label='Enable User SSH'
        inlineLabel={true}
        checked={!isEmpty(sshPlugin.userssh)}
        onChange={_onUsersshEnable}
      />
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
            errorMessage={isEmpty(sshPlugin.getUserSshValue()) ? 'Please Enter Valid SSH public key' : null}
            onChange={_onUsersshValueChange}
            value={sshPlugin.getUserSshValue()}
          />
        </Stack>
      )}
    </Stack>
  );
};

// JobSSH.propTypes = {
//   value: PropTypes.instanceOf(SSHPlugin).isRequired,
//   onValueChange: PropTypes.func,
// };

JobSSH.propTypes = {
  secrets: PropTypes.array,
  extras: PropTypes.object,
  onSecretsChange: PropTypes.func.isRequired,
  onExtrasChange: PropTypes.func.isRequired,
};
