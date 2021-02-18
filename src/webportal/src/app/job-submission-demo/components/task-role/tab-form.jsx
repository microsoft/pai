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

const PureTabForm = ({ dispatch, jobProtocol, currentTaskRole }) => {
  const { taskRoles, prerequisites } = jobProtocol;

  const onLinkClick = item => {
    dispatch({
      type: 'SAVE_CURRENT_TASKROLE',
      payload: item.props.itemKey,
    });
  };

  const onItemAdd = () => {
    const taskRoleName = generateUniqueTaskName(
      taskRoles,
      Object.keys(taskRoles).length,
    );
    const dockerImage = getDockerImageName(prerequisites);
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
        ...jobProtocol,
        extras: {
          ...jobProtocol.extras,
          hivedScheduler: {
            ...jobProtocol.extras.hivedScheduler,
            taskRoles: {
              ...jobProtocol.extras.hivedScheduler.taskRoles,
              [taskRoleName]: {
                skuNum: 1,
                skuType: 'GENERIC-WORKER',
              },
            },
          },
        },
        taskRoles: {
          ...jobProtocol.taskRoles,
          [taskRoleName]: {
            dockerImage,
            instances: 1,
            taskRetryCount: 0,
            resourcePerInstance: { gpu: 1, cpu: 3, memoryMB: 29065 },
            completion: {
              minFailedInstances: 1,
              minSucceedInstances: 1,
            },
          },
        },
      },
    });
    dispatch({
      type: 'SAVE_CURRENT_TASKROLE',
      payload: taskRoleName,
    });
  };

  const onItemDelete = (itemKey, e) => {
    e.stopPropagation();
    if (itemKey === undefined) return;
    if (Object.keys(taskRoles).length === 1) return;

    const updateTaskRoles = taskRoles;
    delete updateTaskRoles[itemKey];

    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: {
        ...jobProtocol,
        taskRoles: updateTaskRoles,
      },
    });
    dispatch({
      type: 'SAVE_CURRENT_TASKROLE',
      payload: Object.keys(taskRoles)[0],
    });
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
          onLinkClick={onLinkClick}
          styles={{
            root: {
              // backgroundColor: 'white',
            },
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

export const TabForm = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
  currentTaskRole: jobInformation.currentTaskRole,
}))(PureTabForm);

PureTabForm.propTypes = {
  dispatch: PropTypes.func,
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
};
