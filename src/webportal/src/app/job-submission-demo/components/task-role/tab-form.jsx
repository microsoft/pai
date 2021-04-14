// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { cloneDeep, isEmpty, isNil, get } from 'lodash';
import {
  ActionButton,
  getTheme,
  Icon,
  IconFontSizes,
  Pivot,
  PivotItem,
} from 'office-ui-fabric-react';
import { Box, Flex } from '../../elements';
import { createUniqueName } from '../../utils/utils';
import { DEFAULT_DOCKER_URI } from '../../utils/constants';
import { JobProtocol } from '../../models/job-protocol';
import { JobTaskRole } from '../../models/job-task-role';
import { DockerInfo } from '../../models/docker-info';

const { spacing } = getTheme();

const HEADER_PREFIX = 'taskrole';
let taskRoleSeq = 1;

const generateUniqueTaskName = (taskRoles, curIndex) => {
  const usedNames = Object.keys(taskRoles).filter(
    (_, index) => index < curIndex,
  );
  const [newName, updateIndex] = createUniqueName(
    usedNames,
    HEADER_PREFIX,
    taskRoleSeq,
  );
  taskRoleSeq = updateIndex;
  return newName;
};

const PureTabForm = ({
  jobProtocol,
  currentTaskRole,
  onJobProtocolChange,
  onTaskRoleSelect,
}) => {
  const { taskRoles, prerequisites } = jobProtocol;

  const onItemAdd = () => {
    const taskRoleName = generateUniqueTaskName(
      taskRoles,
      Object.keys(taskRoles).length,
    );
    let dockerName = DockerInfo.getDockerInfoByUri(
      prerequisites,
      DEFAULT_DOCKER_URI,
    );
    let updatedPrerequisites = Object.assign([], prerequisites);
    if (isEmpty(dockerName)) {
      const [newPrerequisites, newDockerName] = DockerInfo.addDockerInfo(
        prerequisites,
        DEFAULT_DOCKER_URI,
      );
      dockerName = newDockerName;
      updatedPrerequisites = Object.assign([], newPrerequisites);
    }

    const updatedJobTaskRole = new JobTaskRole({
      name: taskRoleName,
      dockerImage: dockerName,
    });
    const [
      updatedTaskRole,
      updatedHivedTaskRole,
    ] = updatedJobTaskRole.convertToProtocolFormat();

    const updatedTaskRoles = cloneDeep(jobProtocol.taskRoles);
    const updatedExtras = cloneDeep(jobProtocol.extras);
    if (isNil(updatedExtras.hivedScheduler)) {
      updatedExtras.hivedScheduler = {};
    }
    const updatedHivedScheduler = updatedExtras.hivedScheduler;
    if (isNil(updatedHivedScheduler.taskRoles)) {
      updatedHivedScheduler.taskRoles = {};
    }
    const updatedHivedTaskRoles = updatedHivedScheduler.taskRoles;

    updatedTaskRoles[taskRoleName] = updatedTaskRole;
    updatedHivedTaskRoles[taskRoleName] = updatedHivedTaskRole;

    onJobProtocolChange({
      ...jobProtocol,
      prerequisites: updatedPrerequisites,
      taskRoles: updatedTaskRoles,
      extras: updatedExtras,
    });
    onTaskRoleSelect(taskRoleName);
  };

  const onItemDelete = (itemKey, e) => {
    e.stopPropagation();
    if (itemKey === undefined) return;
    if (Object.keys(taskRoles).length === 1) return;

    const updateTaskRoles = taskRoles;

    const updatePrerequisites = DockerInfo.removeSafeDockerInfo(
      prerequisites,
      taskRoles,
      itemKey,
      taskRoles[itemKey].dockerImage,
    );

    delete updateTaskRoles[itemKey];

    const updatedExtras = get(jobProtocol, 'extras', {});
    delete updatedExtras.hivedScheduler.taskRoles[itemKey];

    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        prerequisites: updatePrerequisites,
        taskRoles: updateTaskRoles,
        extras: updatedExtras,
      }),
    );
    onTaskRoleSelect(Object.keys(taskRoles)[0]);
  };

  const onRenderItem = (itemProps, defaultRender) => {
    if (itemProps === undefined || defaultRender === undefined) return null;
    return (
      <Box pl='m' pr='m'>
        {defaultRender(itemProps)}
        <Icon
          iconName='Cancel'
          styles={{
            root: { fontSize: IconFontSizes.medium, marginLeft: spacing.m },
          }}
          onClick={onItemDelete.bind(this, itemProps.itemKey)}
        />
      </Box>
    );
  };

  return (
    <Flex bg='white'>
      <Box>
        <Pivot
          onLinkClick={item => onTaskRoleSelect(item.props.itemKey)}
          styles={{
            link: [{ margin: 0, padding: 0 }],
            linkIsSelected: [{ margin: 0, padding: 0 }],
          }}
          selectedKey={currentTaskRole}
        >
          {Object.keys(taskRoles).map(key => (
            <PivotItem
              key={key}
              itemKey={key}
              headerText={key}
              onRenderItemLink={onRenderItem}
            />
          ))}
        </Pivot>
      </Box>
      <Box>
        <ActionButton
          styles={{ root: { padding: `0 ${spacing.l1}` } }}
          iconProps={{ iconName: 'CircleAddition' }}
          text='Add new task role'
          onClick={onItemAdd}
        />
      </Box>
    </Flex>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
  currentTaskRole: state.JobExtraInfo.currentTaskRole,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
  onTaskRoleSelect: key => {
    dispatch({
      type: 'SAVE_CURRENT_TASKROLE',
      payload: key,
    });
  },
});

export const TabForm = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureTabForm);

PureTabForm.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  onJobProtocolChange: PropTypes.func,
  onTaskRoleSelect: PropTypes.func,
};
