import React from 'react';
import {TabForm} from './TabForm';
import {TabFormContent} from './TabFormContent';
import {JobTaskRole} from '../models/jobTaskRole';
import PropTypes from 'prop-types';

export const TaskRoles = (props) => {
  const {defaultValue, onChange} = props;
  const _onRenderTabContent = (keyName, content, defaultOnContentChange) => {
    return (
      <TabFormContent key={keyName}
                      defaultValue={content}
                      onContentChange={defaultOnContentChange}/>
    );
  };

  const _onItemChange = (items) => {
    if (onChange === undefined) {
      return;
    }
    onChange(items.map((item)=>item.content));
  };

  const defaultItems = defaultValue.map((item, index) => {
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
  defaultValue: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  onChange: PropTypes.func,
};

