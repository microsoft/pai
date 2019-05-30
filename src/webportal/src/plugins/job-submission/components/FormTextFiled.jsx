import React from 'react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { Label, TextField, Stack, Text } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle, marginSize } from './formStyle';
import PropTypes from 'prop-types';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const FormTextFiled = (props) => {
  const {label, suffixText, onChange, value, textFiledProps } = props;
  const textFieldId = getId('textField');

  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label htmlFor={textFieldId} styles={formComponentsStyles.label}>{label}</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <Stack horizontal gap={marginSize.s1}>
          <TextField id={textFieldId}
                     styles={formComponentsStyles.textFiled}
                     value={value}
                     onChange={(_, value) => onChange(value)}
                     {...textFiledProps}/>
          <Text styles={formComponentsStyles.suffixText}>{suffixText}</Text>
        </Stack>
      </FormColumn>
    </FormSection>
  );
}

FormTextFiled.propTypes = {
  label: PropTypes.string.isRequired,
  suffixText: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.string,
  textFiledProps: PropTypes.object
};