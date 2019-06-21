import React from 'react';
import {TabForm} from './tab-form';
import {JobTaskRole} from '../models/job-task-role';

import {isEmpty} from 'lodash';
import PropTypes from 'prop-types';

const HEADER_PREFIX = 'Task_role_';
let taskRoleSeq = 1;

export const TaskRoles = React.memo(({taskRoles, onChange, advanceFlag}) => {
  const _onItemChange = (items) => {
    if (onChange === undefined) {
      return;
    }
    onChange(items.map((item) => item.content));
  };

  const _onItemAdd = (items) => {
    const taskRoleName = HEADER_PREFIX + String(taskRoleSeq++);
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

  const items = taskRoles.map((item) => {
    let taskRoleName;
    if (isEmpty(item.name)) {
      taskRoleName = HEADER_PREFIX + String(taskRoleSeq++);
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
