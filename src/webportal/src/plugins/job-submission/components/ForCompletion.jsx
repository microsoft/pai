import React from 'react';
import { Label, Stack, TextField } from 'office-ui-fabric-react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { getFromComponentsStyle, marginSize } from './formStyle';
import PropTypes from 'prop-types';
import { BasicSection } from './BasicSection';

const formComponentsStyles = getFromComponentsStyle();

export const FormCompletion= (props) => {
  const {minFailedInstances, minSucceedInstances} = props;
  const formCompeletionStyle = formComponentsStyles.formCompeletion;
  const minFailedInstancesId = getId('minFailedInstances');
  const minSucceedInstancesId = getId('minSucceedInstances');

  return (
    <BasicSection label={'Completion'} optional>
      <Stack horizontal gap={marginSize.s1} styles={formCompeletionStyle.horizonStack}>
        <Label htmlFor={minFailedInstancesId} styles={formCompeletionStyle.label}>minFailedInstances</Label>
        <TextField id={minFailedInstancesId} styles={formCompeletionStyle.textFiled} value={minFailedInstances} />
      </Stack>
      <Stack horizontal gap={marginSize.s1} styles={formCompeletionStyle.horizonStack}>
        <Label htmlFor={minSucceedInstancesId} styles={formCompeletionStyle.label}>minSucceedInstances</Label>
        <TextField id={minSucceedInstancesId} styles={formCompeletionStyle.textFiled} value={minSucceedInstances} />
      </Stack>
    </BasicSection>
  );
}

FormCompletion.propTypes = {
  minFailedInstances: PropTypes.number,
  minSucceedInstances: PropTypes.number,
};