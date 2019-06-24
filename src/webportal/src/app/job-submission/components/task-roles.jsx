import React from 'react';
import {TabForm} from './tab-form';
import {JobTaskRole} from '../models/job-task-role';

import {createUniqueName} from '../utils/utils';

import {isEmpty} from 'lodash';
import PropTypes from 'prop-types';

const HEADER_PREFIX = 'Task_role';
let taskRoleSeq = 1;

function generateUniqueTaskName(taskRoles, curIndex) {
  const usedNames = taskRoles
    .map((taskRole) => taskRole.name)
    .filter((_, index) => index < curIndex);
  const [newName, updateIndex] = createUniqueName(usedNames, HEADER_PREFIX, taskRoleSeq);
  taskRoleSeq = updateIndex;
  return newName;
}

export const TaskRoles = React.memo(({taskRoles, onChange, advanceFlag}) => {
  const _onItemChange = (items) => {
    if (onChange === undefined) {
      return;
    }
    onChange(items.map((item) => item.content));
  };

  const _onItemAdd = (items) => {
    const taskRoleName = generateUniqueTaskName(
      items.map((item) => item.content),
      items.length,
    );
    const updatedItems = [
      ...items,
      {
        headerText: taskRoleName,
        content: new JobTaskRole({name: taskRoleName}),
      },
    ];
    _onItemChange(updatedItems);
    return updatedItems.length - 1;
  };

  const _onItemDelete = (items, itemIndex) => {
    const updatedItems = items.filter((_, index) => index !== itemIndex);
    _onItemChange(updatedItems);

    // TODO: use other policy to update index
    return 0;
  };

  const items = taskRoles.map((item, index) => {
    let taskRoleName;
    if (isEmpty(item.name)) {
      taskRoleName = generateUniqueTaskName(taskRoles, index);
      item.name = taskRoleName;
    } else {
      taskRoleName = item.name;
    }
    return {headerText: taskRoleName, content: item};
  });

  return (
    <TabForm
      items={items}
      onItemAdd={_onItemAdd}
      onItemDelete={_onItemDelete}
      onItemsChange={_onItemChange}
      advanceFlag={advanceFlag}
    />
  );
});

TaskRoles.propTypes = {
  taskRoles: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  onChange: PropTypes.func,
  advanceFlag: PropTypes.bool,
};
