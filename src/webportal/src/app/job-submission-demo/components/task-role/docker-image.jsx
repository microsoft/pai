import { Dropdown } from 'office-ui-fabric-react';
import React from 'react';
import { connect } from 'react-redux';
import { get, isEmpty } from 'lodash';
import { DEFAULT_DOCKER_URI, DOCKER_OPTIONS } from '../../utils/constants';

const getDockerImageUri = (prerequisites, dockerImage) => {
  const prerequisite = prerequisites.find(
    (prerequisite) => prerequisite.name === dockerImage,
  );
  if (isEmpty(prerequisite)) {
    return DEFAULT_DOCKER_URI;
  }
  return prerequisite.uri;
};

const getDockerImageOptionKey = (uri) => {
  const dockerOption = DOCKER_OPTIONS.find(
    (dockerOption) => dockerOption.image === uri,
  );
  if (isEmpty(dockerOption)) {
    return 'customize-image';
  }
  return dockerOption.key;
};

const PureDockerImage = ({ dispatch, jobProtocol, currentTaskRole }) => {
  const { taskRoles, prerequisites } = jobProtocol;
  const { dockerImage } = taskRoles[currentTaskRole] || {};
  const uri = getDockerImageUri(prerequisites, dockerImage);

  const onChange = (_, item) => {
    const _prerequisites = prerequisites.map((prerequisite) => {
      if (prerequisite.name === dockerImage) {
        prerequisite.uri = item.image;
      }
      return prerequisite;
    });
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
        ...jobProtocol,
        prerequisites: _prerequisites,
      },
    });
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

export const DockerImage = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureDockerImage);
