import React from 'react';
import { Customizer, Label } from 'office-ui-fabric-react';
import { FluentCustomizations } from '@uifabric/fluent-theme';
import { TabForm } from './TabForm';
import { initializeIcons } from '@uifabric/icons';


initializeIcons();

export const App = () => {
  const items = [{key: "k1", label: 'Task role 1', children: <Label>Label</Label>},
                {key: "k2", label: 'Task role 2', children: <Label>Label 2</Label>}];
  return (
    <Customizer {...FluentCustomizations}>
      <TabForm items={ items } enableDeleteItem />
    </Customizer>
  );
}