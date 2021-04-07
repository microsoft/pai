// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { Label, Modal, TextField } from 'office-ui-fabric-react';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Box, Button, Flex, Heading } from '../../elements';
import { DockerInfo } from '../../models/docker-info';

let secretSeq = 0;

const AuthTextField = ({ label, value, type, onChange }) => {
  return (
    <Flex mb='m'>
      <Box mr='m'>
        <Label>{label}</Label>
      </Box>
      <Box width={400}>
        <TextField
          type={type}
          value={value}
          onChange={(_, val) => onChange(label, val)}
        />
      </Box>
    </Flex>
  );
};

AuthTextField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  type: PropTypes.string,
  onChange: PropTypes.func,
};

const PureAuthSection = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
  isOpen,
  onDismiss,
}) => {
  const [dataSource, handleDataSource] = useState({
    username: null,
    password: null,
    registryuri: null,
  });
  const { username, password, registryuri } = dataSource;

  const onChange = (keyName, value) => {
    handleDataSource({ ...dataSource, [keyName]: value });
  };

  const onSubmit = () => {
    const { prerequisites, taskRoles, secrets } = jobProtocol;
    const secretKey = 'docker_password_' + secretSeq++;
    const [
      updatePrerequisites,
      updateDockerName,
    ] = DockerInfo.addAuthDockerInfo(
      prerequisites,
      taskRoles,
      currentTaskRole,
      taskRoles[currentTaskRole].dockerImage,
      {
        username: username,
        password: `<% $secrets.${secretKey} %>`,
        registryuri: registryuri,
      },
    );
    onJobProtocolChange({
      ...jobProtocol,
      prerequisites: updatePrerequisites,
      taskRoles: {
        ...jobProtocol.taskRoles,
        [currentTaskRole]: {
          ...jobProtocol.taskRoles[currentTaskRole],
          dockerImage: updateDockerName,
        },
      },
      secrets: {
        ...secrets,
        [secretKey]: password,
      },
    });
    onDismiss();
  };

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <Box p='m'>
        <Heading>Auth</Heading>
        <Box>
          <AuthTextField
            label='username'
            value={username}
            onChange={onChange}
          />
          <AuthTextField
            label='password'
            type='password'
            value={password}
            onChange={onChange}
          />
          <AuthTextField
            label='registryuri'
            value={registryuri}
            onChange={onChange}
          />
        </Box>
        <Flex justifyContent='flex-end'>
          <Button mr='m' onClick={onSubmit}>
            Submit
          </Button>
          <Button onClick={onDismiss}>Cancel</Button>
        </Flex>
      </Box>
    </Modal>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
  currentTaskRole: state.JobExtraInfo.currentTaskRole,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const AuthSection = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureAuthSection);

PureAuthSection.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
  isOpen: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
};
