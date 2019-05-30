import React, { useState } from 'react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { Label, Stack, Text, Icon } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle, marginSize, getFormBasicSectionStyle } from './formStyle';
import PropTypes from 'prop-types';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();
const basicSectionStyle = getFormBasicSectionStyle();

export const BasicSection = (props) => {
  const {label, optional, children } = props;
  const textFieldId = getId('textField');

  const [isItemOn, setIsItemOn] = useState(false);
  const [iconName, setIconName] = useState('CaretSolidRight');
  const onOpenItem = () => {
    if (isItemOn) {
      setIconName('CaretSolidRight');
    } else {
      setIconName('CaretDown8');
    }
    setIsItemOn(!isItemOn);
  };

  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Stack horizontal gap={'4px'}>
          { optional && <Icon  iconName={iconName}
              styles={basicSectionStyle.icon} onClick={onOpenItem}/> }
          <Label htmlFor={textFieldId} styles={formComponentsStyles.label}>{label}</Label>
          { optional && <Text styles={basicSectionStyle.optionalText}>Optional</Text>}
        </Stack>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <Stack gap={marginSize.s1}>
          {(!optional || isItemOn) && children}
        </Stack>
      </FormColumn>
    </FormSection>
  );
}

BasicSection.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
  optional: PropTypes.bool,
};