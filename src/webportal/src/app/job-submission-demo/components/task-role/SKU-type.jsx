// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

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

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
  currentTaskRole: state.JobExtraInfo.currentTaskRole,
  availableHivedSkuTypes: state.JobExtraInfo.availableHivedSkuTypes,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const SKUType = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureSKUType);

PureSKUType.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  availableHivedSkuTypes: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
