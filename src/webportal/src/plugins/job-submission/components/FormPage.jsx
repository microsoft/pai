import React from 'react';
import { Stack } from 'office-ui-fabric-react';
import { getFormPageSytle } from './formStyle';

const { formPageStyle } = getFormPageSytle();

export const FormPage = (props) => {
  return (
    <Stack styles={formPageStyle} gap={'20px'}>
      {props.children}
    </Stack>
  );
}

export const FormSection = (props) => {
  return (
    <Stack horizontal gap={'16px'}>
      {props.children}
    </Stack>
  );
}

export const FormColumn = (props) => {
  return (
    <Stack styles={props.styles} gap={'16px'}>
      {props.children}
  </Stack>
  )
}