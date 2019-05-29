import React from 'react';
import { Label } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle } from './formStyle';
import { KeyValueList } from './KeyValueList';;

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const FormPortsList = (props) => {
  const { ports, onPortChange, onPortAdd, onPortDelete } = props;

  const _onPortChange = (index, item) => {
    const port = {portLabel: item.itemKey, portValue: item.itemValue};
    onPortChange(index, port);
  }

  return (
    <FormSection>
      <FormColumn styles={formPageStyle.formFirstColumn}>
        <Label styles={formComponentsStyles.label}>Ports</Label>
      </FormColumn>
      <FormColumn styles={formPageStyle.formSecondColunm}>
        <KeyValueList items={ports.map((port)=>{return {itemKey: port.portLabel, itemValue: port.portValue};})}
                      onItemAdd={onPortAdd}
                      onItemDelete={onPortDelete}
                      onItemChange={_onPortChange}/>
      </FormColumn>
    </FormSection>
  );
}