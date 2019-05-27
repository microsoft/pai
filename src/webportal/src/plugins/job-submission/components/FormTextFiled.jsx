import React from 'react';
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { Label, TextField, PrimaryButton } from 'office-ui-fabric-react';
import { FormSection, FormFirstColumn, FormSecondColunm } from './FormPage';

export const FormTextFiled = (props) => {
  const {label, required, placeholder} = props;
  const textFieldId = getId('textField');

  return (
    <FormSection>
      <FormFirstColumn>
        <Label htmlFor={textFieldId} required={required} >{label}</Label>
      </FormFirstColumn>
      <FormSecondColunm>
        <TextField id={textFieldId} placeholder={placeholder}/>
      </FormSecondColunm>
    </FormSection>
  );
}

export const FormDockerSection = () => {
  const textFieldId = getId('textField');

  return (
    <FormSection>
      <FormFirstColumn>
        <Label htmlFor={textFieldId} required>Docker</Label>
      </FormFirstColumn>
      <FormSecondColunm>
        <TextField id={textFieldId} placeholder='Enter docker uri...'/>
        <span><PrimaryButton>Auth</PrimaryButton></span>
      </FormSecondColunm>
    </FormSection>
  );
}