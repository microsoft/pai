// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { cloneDeep, isNil, isEmpty } from 'lodash';
import { DefaultButton, TextField, Toggle } from 'office-ui-fabric-react';
import { Box, Flex, Row, Text } from '../../elements';
import { TooltipIcon } from '../controls/tooltip-icon';
import SSHGenerator from './ssh-generator';
import {
  PAI_PLUGIN,
  PROTOCOL_TOOLTIPS,
  SSH_KEY_BITS,
} from '../../utils/constants';
import { SSHPlugin } from '../../models/ssh-plugin';

const PureJobSSH = ({ jobProtocol, onJobProtocolChange }) => {
  const [sshPlugin, setSSHPlugin] = useState(
    SSHPlugin.fromProtocol(jobProtocol),
  );
  const [sshGenerator, setSshGenerator] = useState({ isOpen: false });

  useEffect(() => {
    const updatedSSHPlugin = SSHPlugin.fromProtocol(jobProtocol);
    setSSHPlugin(updatedSSHPlugin);
  }, [jobProtocol.extras]);

  const onExtrasChange = (keyName, propValue) => {
    const updatedSSHPlugin = new SSHPlugin(sshPlugin);
    updatedSSHPlugin[keyName] = propValue;
    setSSHPlugin(updatedSSHPlugin);
    const updatedExtras = cloneDeep(jobProtocol.extras);
    if (isNil(updatedExtras[PAI_PLUGIN])) {
      updatedExtras[PAI_PLUGIN] = [];
    }
    const pluginBase = updatedExtras[PAI_PLUGIN];
    const sshIndex = pluginBase.findIndex(plugin => plugin.plugin === 'ssh');
    if (sshIndex >= 0) {
      pluginBase[sshIndex] = updatedSSHPlugin.convertToProtocolFormat();
    } else {
      pluginBase.push(updatedSSHPlugin.convertToProtocolFormat());
    }
    onJobProtocolChange({ ...jobProtocol, extras: updatedExtras });
  };

  const onUserSSHValueChange = e => {
    onExtrasChange('userssh', { ...sshPlugin.userssh, value: e.target.value });
  };

  const onUserSSHEnable = (_, checked) => {
    if (!checked) {
      onExtrasChange('userssh', {});
    } else {
      onExtrasChange('userssh', { type: 'custom', value: '' });
    }
  };

  const openSSHGenerator = () => {
    setSshGenerator({
      isOpen: true,
      bits: SSH_KEY_BITS,
    });
  };
  const hideSSHGenerator = () => {
    setSshGenerator({ isOpen: false });
  };

  const onSSHKeyGenerated = sshKeys => {
    onExtrasChange('userssh', { ...sshPlugin.userssh, value: sshKeys.public });
  };

  return (
    <>
      <Flex flexDirection='horizontal' alignItems='baseline' marginBottom='s1'>
        <Text>SSH</Text>
        <TooltipIcon content={PROTOCOL_TOOLTIPS.ssh} />
      </Flex>
      <Toggle
        label={'Enable User SSH'}
        inlineLabel={true}
        onChange={onUserSSHEnable}
      />
      {!isEmpty(sshPlugin.userssh) && (
        <Box>
          <Box fontSize='s2' lineHeight={2} marginBottom='s1'>
            Your pre-defined SSH public keys on the{' '}
            <a href='/user-profile.html'>User Profile</a> page will be set
            automatically.
          </Box>
          <Row gap='l1'>
            <TextField
              lable='Add additional SSH public key'
              placeholder='Additional SSH public key'
              disabled={sshPlugin.userssh.type === 'none'}
              onChange={onUserSSHValueChange}
              value={sshPlugin.getUserSSHValue()}
            />
            <DefaultButton onClick={() => openSSHGenerator()}>
              Generator
            </DefaultButton>
            {sshGenerator.isOpen && (
              <SSHGenerator
                isOpen={sshGenerator.isOpen}
                bits={sshGenerator.bits}
                hide={hideSSHGenerator}
                onSshKeysChange={onSSHKeyGenerated}
              />
            )}
          </Row>
        </Box>
      )}
    </>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const JobSSH = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureJobSSH);

PureJobSSH.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
