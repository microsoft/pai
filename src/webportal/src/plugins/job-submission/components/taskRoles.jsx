import React from 'react';
import {TabForm} from './tabForm';
import {TabFormContent} from './tabFormContent';
import {JobTaskRole} from '../models/jobTaskRole';
import PropTypes from 'prop-types';

export const TaskRoles = (props) => {
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
    onChange(items.map((item)=>item.content));
  };

  const defaultItems = taskRoles.map((item, index) => {
    return {headerText: `Task role ${index + 1}`, content: item};
  });

  return (
    <TabForm defaultItems={defaultItems}
             headerTextPrefix='Task Role'
             createContentFunc={() => new JobTaskRole({})}
             onRenderTabContent={_onRenderTabContent}
             onItemsChange={_onItemChange} />
  );
};

TaskRoles.propTypes = {
  taskRoles: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  onChange: PropTypes.func,
};

