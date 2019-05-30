import React from 'react';
import { Label, Stack, SpinButton } from 'office-ui-fabric-react';
import { getFromComponentsStyle, marginSize } from './formStyle';
import PropTypes from 'prop-types';
import { BasicSection } from './BasicSection';

const formComponentsStyles = getFromComponentsStyle();

export const Completion= (props) => {
  const {minFailedInstances, minSucceedInstances} = props;
  const formCompeletionStyle = formComponentsStyles.formCompeletion;

  return (
    <BasicSection label={'Completion'} optional>
      <Stack horizontal gap={marginSize.s1} styles={formCompeletionStyle.horizonStack}>
        <Label styles={formCompeletionStyle.label}>minFailedInstances</Label>
        <SpinButton  styles={formCompeletionStyle.textFiled} value={minFailedInstances} />
      </Stack>
      <Stack horizontal gap={marginSize.s1} styles={formCompeletionStyle.horizonStack}>
        <Label styles={formCompeletionStyle.label}>minSucceedInstances</Label>
        <SpinButton styles={formCompeletionStyle.textFiled} value={minSucceedInstances} />
      </Stack>
    </BasicSection>
  );
}

Completion.propTypes = {
  minFailedInstances: PropTypes.number,
  minSucceedInstances: PropTypes.number,
};