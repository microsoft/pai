// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { isEmpty, isNil, get } from 'lodash';
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
    onChange('hivedSku', { ...value, skuType: item.key, sku: item.sku });
  };

  useEffect(() => {
    if (!isNil(value.skuType)) {
      const selected = skuOptions.find(option => option.key === value.skuType);
      if (isNil(selected)) {
        onChange('hivedSku', { ...value, skuType: null, sku: null });
      } else if (value.sku == null) {
        value.sku = get(selected, 'sku', null);
      }
    } else if (!isEmpty(skuOptions)) {
      onChange('hivedSku', {
        ...value,
        skuType: skuOptions[0].key,
        sku: skuOptions[0].sku,
      });
    }
  }, [value, skuOptions]);

  console.log(value);

  return (
    <Dropdown
      placeholder='Select SKU type'
      options={skuOptions}
      selectedKey={value.skuType}
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
