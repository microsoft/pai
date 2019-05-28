import React from 'react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { Label, TextField, PrimaryButton, Stack, Text } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle } from './formStyle';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const FormTextFiled = (props) => {
  const {label, required, placeholder, suffixText} = props;
  const textFieldId = getId('textField');

  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label htmlFor={textFieldId} required={required} styles={formComponentsStyles.label}>{label}</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <Stack horizontal gap={'8px'}>
          <TextField id={textFieldId} placeholder={placeholder} styles={formComponentsStyles.textFiled}/>
          <Text styles={formComponentsStyles.suffixText}>{suffixText}</Text>
        </Stack>
      </FormColumn>
    </FormSection>
  );
}

export const FormDockerSection = () => {
  const textFieldId = getId('textField');

  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label htmlFor={textFieldId} required styles={formComponentsStyles.label}>Docker</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <TextField id={textFieldId} placeholder='Enter docker uri...' styles={formComponentsStyles.textFiled}/>
        <span><PrimaryButton>Auth</PrimaryButton></span>
      </FormColumn>
    </FormSection>
  );
}