import React from 'react'
import { getId } from 'office-ui-fabric-react/lib/Utilities';
import { Stack, Label, TextField, Button } from 'office-ui-fabric-react';
import { getFromTextFieldStyle }  from './formStyle';

export const FormTextFiled = (props) => {
  const {label, required, placeholder} = props;
  const textFieldId = getId('textField');
  const formTextFieldStyle = getFromTextFieldStyle();

  return (
    <Stack horizontal styles={{root: formTextFieldStyle.root}}>
        <Label htmlFor={textFieldId} required={required} styles={formTextFieldStyle.label}>{label}</Label>
        <Stack.Item styles={{root: {width: '60%'}}}>
        <TextField id={textFieldId} placeholder={placeholder}/>
        <Button>Auth</Button>
        </Stack.Item>
    </Stack>
  );
}