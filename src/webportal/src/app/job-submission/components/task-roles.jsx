import React, { useContext, useMemo } from 'react';
import { TabForm } from './tab-form';
import { JobTaskRole } from '../models/job-task-role';
import Context from './context';

import { createUniqueName } from '../utils/utils';

import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';

const HEADER_PREFIX = 'taskrole';
let taskRoleSeq = 1;

function generateUniqueTaskName(taskRoles, curIndex) {
  const usedNames = taskRoles
    .map(taskRole => taskRole.name)
    .filter((_, index) => index < curIndex);
  const [newName, updateIndex] = createUniqueName(
    usedNames,
    HEADER_PREFIX,
    taskRoleSeq,
  );
  taskRoleSeq = updateIndex;
  return newName;
}

export const TaskRoles = React.memo(
  ({ taskRoles, onChange, advanceFlag, isSingle }) => {
    const _onItemChange = items => {
      if (onChange === undefined) {
        return;
      }
      onChange(items.map(item => item.content));
    };

    const _onItemAdd = items => {
      const taskRoleName = generateUniqueTaskName(
        items.map(item => item.content),
        items.length,
      );
      const updatedItems = [
        ...items,
        {
          headerText: taskRoleName,
          content: new JobTaskRole({ name: taskRoleName }),
        },
      ];
      _onItemChange(updatedItems);
      return updatedItems.length - 1;
    };

    const _onItemDelete = (items, itemIndex) => {
      if (items.length === 1) {
        return 0;
      }
      const updatedItems = items.filter((_, index) => index !== itemIndex);
      _onItemChange(updatedItems);

      // TODO: use other policy to update index
      return 0;
    };

    const items = taskRoles.map((item, index) => {
      let taskRoleName;
      if (!isEmpty(item.name)) {
        taskRoleName = item.name;
      }
      return { headerText: taskRoleName, content: item };
    });

    const { setErrorMessage } = useContext(Context);
    useMemo(() => {
      const nameCount = items.reduce((res, item) => {
        if (res[item.headerText] === undefined) {
          res[item.headerText] = 0;
        }
        res[item.headerText] += 1;
        return res;
      }, {});
      const dupNames = Object.keys(nameCount).filter(key => nameCount[key] > 1);
      if (dupNames.length > 0) {
        setErrorMessage(
          'TaskRole',
          `task role name '${dupNames}' is duplicated`,
        );
      } else {
        setErrorMessage('TaskRole', '');
      }
    }, [taskRoles]);

    return (
      <TabForm
        items={items}
        onItemAdd={_onItemAdd}
        onItemDelete={_onItemDelete}
        onItemsChange={_onItemChange}
        advanceFlag={advanceFlag}
        isSingle={isSingle}
      />
    );
  },
);

TaskRoles.propTypes = {
  taskRoles: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  onChange: PropTypes.func,
  advanceFlag: PropTypes.bool,
  isSingle: PropTypes.bool,
};
