import React from 'react';
import { Label } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle } from './formStyle';
import { KeyValueList } from './KeyValueList';;

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const FormPortsList = (props) => {
  const { items } = props;
  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label styles={formComponentsStyles.label}>Ports</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <KeyValueList items={items}/>
      </FormColumn>
    </FormSection>
  );
}