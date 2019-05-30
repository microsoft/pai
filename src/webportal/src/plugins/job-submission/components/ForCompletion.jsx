import React from 'react';
import { Label, Stack, TextField } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { getFormPageSytle, getFromComponentsStyle, marginSize } from './formStyle';
import PropTypes from 'prop-types';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const FormCompletion= (props) => {
  const {minFailedInstances, minSucceedInstances} = props;
  const formCompeletionStyle = formComponentsStyles.formCompeletion;
  const minFailedInstancesId = getId('minFailedInstances');
  const minSucceedInstancesId = getId('minSucceedInstances');

  return (
  <FormSection>
    <FormColumn styles={formPageStyle.formFirstColumn}>
      <Label styles={formComponentsStyles.label}>Completion</Label>
    </FormColumn>
    <FormColumn styles={formPageStyle.formSecondColunm}>
      <Stack horizontal gap={marginSize.s1} styles={formCompeletionStyle.horizonStack}>
          <Label htmlFor={minFailedInstancesId} styles={formCompeletionStyle.label}>minFailedInstances</Label>
          <TextField id={minFailedInstancesId} styles={formCompeletionStyle.textFiled} value={minFailedInstances}/>
      </Stack>
      <Stack horizontal gap={marginSize.s1} styles={formCompeletionStyle.horizonStack}>
        <Label htmlFor={minSucceedInstancesId} styles={formCompeletionStyle.label}>minSucceedInstances</Label>
        <TextField id={minSucceedInstancesId} styles={formCompeletionStyle.textFiled} value={minSucceedInstances}/>
      </Stack>
    </FormColumn>
  </FormSection>);
}

FormCompletion.propTypes = {
  minFailedInstances: PropTypes.number,
  minSucceedInstances: PropTypes.number,
};