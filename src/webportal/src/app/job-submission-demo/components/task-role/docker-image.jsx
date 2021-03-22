// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { Dropdown } from 'office-ui-fabric-react';
import React from 'react';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';
import { DEFAULT_DOCKER_URI, DOCKER_OPTIONS } from '../../utils/constants';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

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
}) => {
  const { taskRoles, prerequisites } = jobProtocol;
  const { dockerImage } = taskRoles[currentTaskRole] || {};
  const uri = getDockerImageUri(prerequisites, dockerImage);

  const onChange = (_, item) => {
    const _prerequisites = prerequisites.map(prerequisite => {
      if (prerequisite.name === dockerImage) {
        prerequisite.uri = item.image;
      }
      return prerequisite;
    });
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        prerequisites: _prerequisites,
      }),
    );
  };

  return (
    <Dropdown
      placeholder='Select a docker image'
      options={DOCKER_OPTIONS}
      selectedKey={getDockerImageOptionKey(uri)}
      onChange={onChange}
    />
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
};
