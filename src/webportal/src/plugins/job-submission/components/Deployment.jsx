import React from 'react';
import { TextField } from 'office-ui-fabric-react';
import { getFromComponentsStyle } from './formStyle';
import { BasicSection } from './BasicSection';

export const Deployment = (props) => {

  return (
    <BasicSection label={'Deployment'} optional>
      <TextField label={'PreCommands'} />
      <TextField label={'PostCommands'} />
    </BasicSection>
  );
}