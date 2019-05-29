import React, { useState } from 'react';
import { Customizer, Stack } from 'office-ui-fabric-react';
import { FluentCustomizations } from '@uifabric/fluent-theme';
import { TabForm } from './TabForm';
import { initializeIcons } from '@uifabric/icons';
import { TabContent } from './TabFormContent';
import { JobTaskRole } from '../models/jobTaskRole';


initializeIcons();

export const App = () => {
  const originItems = [{headerText: 'Task role 1', content: new JobTaskRole()},
                       {headerText: 'Task role 2', content: new JobTaskRole()}];

  const [items, setItems] = useState(originItems);
  const onItemAdd = () => {
    const updatedItems = [...items, {headerText: 'Task role X', content: new JobTaskRole()}];
    setItems(updatedItems);
    return updatedItems.length - 1;
  }

  const onItemDelete = (itemIndex) => {
    const updatedItems = items.filter((_, index) => { return index !== itemIndex;});
    setItems(updatedItems);
  }

  const getItems = (items) => {
    return items.map((item, index) => {
      return {headerText: item.headerText,
              content: <TabContent jobTaskRole={item.content}
                                   onContentChange={(dockerInfo)=>{
                                     const updatedItems = [...items];
                                     updatedItems[index].content.dockerInfo = dockerInfo;
                                     setItems(updatedItems);
                                   }}/>}
    });
  };

  return (
    <Customizer {...FluentCustomizations}>
      <Stack horizontal>
        <Stack.Item grow={7} styles={{root: {maxWidth: '70%'}}}>
          <TabForm items={getItems(items)} onItemAdd={onItemAdd} onItemDelete={onItemDelete} />
        </Stack.Item>
        <Stack.Item grow={3} disableShrink>
          Empty for something
        </Stack.Item>
      </Stack>
    </Customizer>
  );
}