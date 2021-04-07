// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { isEmpty, isNil } from 'lodash';
import PropTypes from 'prop-types';
import { Dropdown } from 'office-ui-fabric-react';

const PureSKUType = ({ value, onChange, availableHivedSkuTypes }) => {
  const skuOptions = Object.keys(availableHivedSkuTypes).map(name => {
    const { gpu, cpu, memory } = availableHivedSkuTypes[name];
    return {
      key: name,
      sku: { gpu, cpu, memory },
      text: `${name} (${gpu} GPU, ${cpu} CPU, ${memory} memory)`,
    };
  });

  const onItemChange = (_, item) => {
    onChange('skuType', item.key);
  };

  useEffect(() => {
    if (!isNil(value)) {
      const selected = skuOptions.find(option => option.key === value);
      if (isNil(selected)) onChange('skuType', null);
    } else if (!isEmpty(skuOptions)) {
      onChange('skuType', skuOptions[0].key);
    }
  }, [value, skuOptions]);

  return (
    <Dropdown
      placeholder='Select SKU type'
      options={skuOptions}
      selectedKey={value}
      onChange={onItemChange}
    />
  );
};

const mapStateToProps = state => ({
  availableHivedSkuTypes: state.JobExtraInfo.availableHivedSkuTypes,
});

const mapDispatchToProps = () => {};

export const SKUType = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureSKUType);

PureSKUType.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  availableHivedSkuTypes: PropTypes.object,
};
