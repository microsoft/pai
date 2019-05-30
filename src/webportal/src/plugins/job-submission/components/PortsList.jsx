import React from 'react';
import { Label } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle } from './formStyle';
import { KeyValueList } from './KeyValueList';
import PropTypes from 'prop-types';
import { Port } from '../models/port';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const PortsList = (props) => {
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
        <span>Key value list</span>
        <KeyValueList items={ports.map((port)=>{return {itemKey: port.portLabel, itemValue: port.portValue};})}
                      onItemAdd={onPortAdd}
                      onItemDelete={onPortDelete}
                      onItemChange={_onPortChange}/>
      </FormColumn>
    </FormSection>
  );
}

PortsList.propTypes = {
  ports: PropTypes.arrayOf(PropTypes.instanceOf(Port)),
  onPortChange: PropTypes.func,
  onPortAdd: PropTypes.func,
  onPortDelete: PropTypes.func,
};