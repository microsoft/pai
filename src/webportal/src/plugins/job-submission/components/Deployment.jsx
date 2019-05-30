import React from 'react';
import { TextField } from 'office-ui-fabric-react';
import { getFromComponentsStyle } from './formStyle';
import { BasicSection } from './BasicSection';

const formComponentsStyles = getFromComponentsStyle();

export const Deployment = (props) => {
  const {minFailedInstances, minSucceedInstances} = props;
  const formCompeletionStyle = formComponentsStyles.formCompeletion;

  return (
    <BasicSection label={'Deployment'} optional>
      <TextField label={'PreCommands'} styles={formCompeletionStyle.textFiled} value={minFailedInstances} />
      <TextField label={'PostCommands'} styles={formCompeletionStyle.textFiled} value={minSucceedInstances} />
    </BasicSection>
  );
}