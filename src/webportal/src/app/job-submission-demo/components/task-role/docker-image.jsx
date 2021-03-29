// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { DefaultButton, Dropdown, TextField } from 'office-ui-fabric-react';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';
import { DEFAULT_DOCKER_URI, DOCKER_OPTIONS } from '../../utils/constants';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';
import { Box, Flex } from '../../elements';
import { AuthSection } from './auth-section';
import { DockerInfo } from '../../models/docker-info';

const getDockerImageUri = (prerequisites, dockerImage) => {
  const prerequisite = prerequisites.find(
    prerequisite => prerequisite.name === dockerImage,
  );
  if (isEmpty(prerequisite)) {
    return DEFAULT_DOCKER_URI;
  }
  return prerequisite.uri;
};

const getDockerImageOptionKey = uri => {
  const dockerOption = DOCKER_OPTIONS.find(
    dockerOption => dockerOption.image === uri,
  );
  if (isEmpty(dockerOption)) {
    return 'customize-image';
  }
  return dockerOption.key;
};

const PureDockerImage = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
  customized,
}) => {
  const [showAuth, setShowAuth] = useState(false);
  const { taskRoles, prerequisites } = jobProtocol;
  const { dockerImage } = taskRoles[currentTaskRole] || {};
  const uri = getDockerImageUri(prerequisites, dockerImage);

  const _onChange = dockerUri => {
    const isDokcerUnique = DockerInfo.isUniqueInTaskRoles(
      taskRoles,
      currentTaskRole,
      dockerImage,
    );
    const [updatePrerequisites, updateDockerName] = DockerInfo.changeDockerInfo(
      prerequisites,
      dockerImage,
      dockerUri,
      isDokcerUnique,
    );
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        prerequisites: updatePrerequisites,
        taskRoles: {
          ...jobProtocol.taskRoles,
          [currentTaskRole]: {
            ...jobProtocol.taskRoles[currentTaskRole],
            dockerImage: updateDockerName,
          },
        },
      }),
    );
  };

  const onDockerImageChange = (_, item) => {
    _onChange(item.image);
  };

  const onUriChange = e => {
    _onChange(e.target.value);
  };

  return (
    <>
      <Dropdown
        placeholder='Select a docker image'
        options={DOCKER_OPTIONS}
        selectedKey={getDockerImageOptionKey(uri)}
        onChange={onDockerImageChange}
        disabled={customized}
      />
      {customized && (
        <Flex mt='m'>
          <Box flex={1}>
            <TextField
              placeholder='Enter docker uri...'
              errorMessage={isEmpty(uri) ? 'Docker should not be empty' : null}
              value={uri}
              onChange={onUriChange}
            />
          </Box>
          <DefaultButton onClick={() => setShowAuth(true)}>Auth</DefaultButton>
        </Flex>
      )}
      {showAuth && (
        <AuthSection isOpen={showAuth} onDismiss={() => setShowAuth(false)} />
      )}
    </>
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

export const DockerImage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureDockerImage);

PureDockerImage.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
  customized: PropTypes.bool.isRequired,
};
