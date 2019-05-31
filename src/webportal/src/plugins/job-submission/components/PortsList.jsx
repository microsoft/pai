import React from 'react';
import { KeyValueList } from './KeyValueList';
import PropTypes from 'prop-types';
import { Port } from '../models/port';
import { BasicSection } from './BasicSection';

export const PortsList = (props) => {
  const { ports, onPortAdd, onPortDelete } = props;
  const _onPortAdd = (item)=> {
    const port = new Port(item.itemKey, item.itemValue);
    onPortAdd(port);
  }

  return (
    <BasicSection label='Ports' optional>
      <KeyValueList items={ports.map((port)=>{return {itemKey: port.portLabel, itemValue: port.portNumber};})}
                      onItemAdd={_onPortAdd}
                      onItemDelete={onPortDelete}/>
    </BasicSection>
  );
}

PortsList.propTypes = {
  ports: PropTypes.arrayOf(PropTypes.instanceOf(Port)),
  onPortAdd: PropTypes.func,
  onPortDelete: PropTypes.func,
};