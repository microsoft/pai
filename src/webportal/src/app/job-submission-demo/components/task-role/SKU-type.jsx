import React from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'office-ui-fabric-react';

const PureSKUType = ({ availableHivedSkuTypes }) => {
  const options = Object.keys(availableHivedSkuTypes).map(name => {
    const { gpu, cpu, memory } = availableHivedSkuTypes[name];
    return {
      key: name,
      sku: { gpu, cpu, memory },
      text: `${name} (${gpu} GPU, ${cpu} CPU, ${memory} memory)`,
    };
  });

  const onChange = (_, item) => {
    console.log(item);
  };

  return (
    <Dropdown
      placeholder='Select SKU type'
      options={options}
      onChange={onChange}
      // selectedKey={skuType}
    />
  );
};

export const SKUType = connect(({ jobInformation }) => ({
  availableHivedSkuTypes: jobInformation.availableHivedSkuTypes,
}))(PureSKUType);
