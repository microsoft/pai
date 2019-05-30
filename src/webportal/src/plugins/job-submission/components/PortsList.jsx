import React from 'react';
import { Label } from 'office-ui-fabric-react';
import { FormSection, FormColumn } from './FormPage';
import { getFormPageSytle, getFromComponentsStyle } from './formStyle';
import { KeyValueList } from './KeyValueList';
import PropTypes from 'prop-types';
import { Port } from '../models/port';
import { BasicSection } from './BasicSection';

const formPageStyle = getFormPageSytle();
const formComponentsStyles = getFromComponentsStyle();

export const PortsList = (props) => {
  const { ports, onPortChange, onPortAdd, onPortDelete } = props;

  const _onPortChange = (index, item) => {
    const port = {portLabel: item.itemKey, portValue: item.itemValue};
    onPortChange(index, port);
  }

  return (
    <BasicSection label='Ports' optional>
      <KeyValueList items={ports.map((port)=>{return {itemKey: port.portLabel, itemValue: port.portValue};})}
                      onItemAdd={onPortAdd}
                      onItemDelete={onPortDelete}
                      onItemChange={_onPortChange}/>
    </BasicSection>
  );
}

PortsList.propTypes = {
  ports: PropTypes.arrayOf(PropTypes.instanceOf(Port)),
  onPortChange: PropTypes.func,
  onPortAdd: PropTypes.func,
  onPortDelete: PropTypes.func,
};