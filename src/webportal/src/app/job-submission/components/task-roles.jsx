import React from 'react';
import {TabForm} from './tab-form';
import {TabFormContent} from './tab-form-content';
import {JobTaskRole} from '../models/job-task-role';
import PropTypes from 'prop-types';

export const TaskRoles = React.memo((props) => {
  const {taskRoles, onChange} = props;
  const _onRenderTabContent = (keyName, content, defaultOnContentChange) => {
    return (
      <TabFormContent key={keyName}
                      jobTaskRole={content}
                      onContentChange={defaultOnContentChange}/>
    );
  };

  const _onItemChange = (items) => {
    if (onChange === undefined) {
      return;
    }
    onChange(items.map((item) => item.content));
  };

  const _onItemAdd = (items) => {
    const updatedItems = [...items, {headerText: `Task role ${items.length + 1}`, content: new JobTaskRole({})}];
    _onItemChange(updatedItems);
    return updatedItems.length - 1;
  };

  const _onItemDelete = (items, itemIndex) => {
    const updatedItems = items.filter((_, index) => index !== itemIndex)
                              .map((item, index) => {
                                item.headerText = `Task role ${index + 1}`;
                                return item;
                              });
    _onItemChange(updatedItems);

    // TODO: use other policy to update index
    return 0;
  };

  const items = taskRoles.map((item, index) => {
    return {headerText: `Task role ${index + 1}`, content: item};
  });

  return (
    <TabForm items={items}
             headerTextPrefix='Task Role'
             onItemAdd={_onItemAdd}
             onItemDelete={_onItemDelete}
             onRenderTabContent={_onRenderTabContent}
             onItemsChange={_onItemChange} />
  );
});

TaskRoles.propTypes = {
  taskRoles: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  onChange: PropTypes.func,
};

