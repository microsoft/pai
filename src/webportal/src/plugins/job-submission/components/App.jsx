import React from 'react';
import { Customizer, Stack } from 'office-ui-fabric-react';
import { FluentCustomizations } from '@uifabric/fluent-theme';
import { TabForm } from './TabForm';
import { initializeIcons } from '@uifabric/icons';
import { TabContent } from './TabFormContent';


initializeIcons();

export const App = () => {
  const items = [{headerText: 'Task role 1', content: <TabContent>Label</TabContent>},
                 {headerText: 'Task role 2', content: <TabContent>Label 2</TabContent>}];
  return (
    <Customizer {...FluentCustomizations}>
      <Stack horizontal>
        <Stack.Item grow={7} styles={{root: {maxWidth: '70%'}}}>
          <TabForm items={items} onItemAdd={()=>{return {headerText: 'Task role x', content: <TabContent></TabContent>}}} />
        </Stack.Item>
        <Stack.Item grow={3} disableShrink>
          Empty for something
        </Stack.Item>
      </Stack>
    </Customizer>
  );
}