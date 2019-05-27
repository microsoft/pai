import React from 'react';
import { Stack } from 'office-ui-fabric-react';
import { getFormPageSytle } from './formStyle';

const { FormPageStyle, FormFirstColumnSytle, FormSecondColunmStyle } = getFormPageSytle();

export const FormPage = (props) => {
  return (
    <Stack styles={FormPageStyle} gap={'20px'}>
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

export const FormFirstColumn = (props) => {
  return (
    <Stack styles={FormFirstColumnSytle}>
      {props.children}
    </Stack>
  );
}

export const FormSecondColunm = (props) => {
  return (
    <Stack styles={FormSecondColunmStyle} gap={'16px'}>
      {props.children}
    </Stack>
  );
}