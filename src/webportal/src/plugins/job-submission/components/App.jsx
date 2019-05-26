import React from 'react';
import { Customizer, Label } from 'office-ui-fabric-react';
import { FluentCustomizations } from '@uifabric/fluent-theme';
import { TabForm } from './TabForm';
import { initializeIcons } from '@uifabric/icons';


initializeIcons();

export const App = () => {
  const items = [{label: 'Task role 1', children: <Label>Label</Label>}];
  return (
    <Customizer {...FluentCustomizations}>
      <TabForm  headerTemplate='Task role' minCount={2} pageTemplate={<Label>Label</Label>} />
    </Customizer>
  );
}