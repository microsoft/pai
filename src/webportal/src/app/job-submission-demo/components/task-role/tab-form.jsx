// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { Box, Flex } from '../../elements';
import {
  ActionButton,
  getTheme,
  Icon,
  IconFontSizes,
  Pivot,
  PivotItem,
} from 'office-ui-fabric-react';
import { createUniqueName } from '../../utils/utils';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

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

const getDockerImageName = prerequisites => {
  const prerequisite = prerequisites.find(
    prerequisite => prerequisite.type === 'dockerimage',
  );
  return prerequisite.name;
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
    const dockerImage = getDockerImageName(prerequisites);
    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        // extras: {
        //   ...jobProtocol.extras,
        //   hivedScheduler: {
        //     ...jobProtocol.extras.hivedScheduler,
        //     taskRoles: {
        //       ...jobProtocol.extras.hivedScheduler.taskRoles,
        //       [taskRoleName]: {
        //         skuNum: 1,
        //         skuType: 'GENERIC-WORKER',
        //       },
        //     },
        //   },
        // },
        taskRoles: {
          ...jobProtocol.taskRoles,
          [taskRoleName]: {
            completion: {
              minFailedInstances: 1,
            },
            dockerImage,
            instances: 1,
            taskRetryCount: 0,
          },
        },
      }),
    );
    onTaskRoleSelect(taskRoleName);
  };

  const onItemDelete = (itemKey, e) => {
    e.stopPropagation();
    if (itemKey === undefined) return;
    if (Object.keys(taskRoles).length === 1) return;

    const updateTaskRoles = taskRoles;
    delete updateTaskRoles[itemKey];

    onJobProtocolChange(
      new JobProtocol({
        ...jobProtocol,
        taskRoles: updateTaskRoles,
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
