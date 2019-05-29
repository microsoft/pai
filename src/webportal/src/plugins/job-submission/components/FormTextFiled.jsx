import React from 'react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { Label, TextField, Stack, Text } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle, marginSize } from './formStyle';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const FormTextFiled = (props) => {
  const {label, required, placeholder, suffixText, onChange, value } = props;
  const textFieldId = getId('textField');

  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label htmlFor={textFieldId} required={required} styles={formComponentsStyles.label}>{label}</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <Stack horizontal gap={marginSize.s1}>
          <TextField id={textFieldId}
                     placeholder={placeholder}
                     styles={formComponentsStyles.textFiled}
                     value={value}
                     onChange={(_, value) => onChange(value)}/>
          <Text styles={formComponentsStyles.suffixText}>{suffixText}</Text>
        </Stack>
      </FormColumn>
    </FormSection>
  );
}