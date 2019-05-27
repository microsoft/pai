import React from 'react';
import { Customizer, Label } from 'office-ui-fabric-react';
import { FluentCustomizations } from '@uifabric/fluent-theme';
import { TabForm } from './TabForm';
import { initializeIcons } from '@uifabric/icons';


initializeIcons();

export const App = () => {
  const items = [{headerText: 'Task role 1', content: <Label>Label</Label>},
                 {headerText: 'Task role 2', content: <Label>Label 2</Label>}];
  return (
    <Customizer {...FluentCustomizations}>
      <TabForm items={items} onItemAdd={()=>{return {headerText: 'Task role x', content: <Label>Label</Label>}}} />
    </Customizer>
  );
}