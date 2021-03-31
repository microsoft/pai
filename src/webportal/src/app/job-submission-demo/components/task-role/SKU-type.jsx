// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { get, isEmpty } from 'lodash';
import { Dropdown } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

const PureSKUType = ({
  jobProtocol,
  currentTaskRole,
  availableHivedSkuTypes,
  onJobProtocolChange,
}) => {
  const skuType = get(
    jobProtocol,
    `extras.hivedScheduler.taskRoles[${currentTaskRole}].skuType`,
    null,
  );

  const skuOptions = Object.keys(availableHivedSkuTypes).map(name => {
    const { gpu, cpu, memory } = availableHivedSkuTypes[name];
    return {
      key: name,
      sku: { gpu, cpu, memory },
      text: `${name} (${gpu} GPU, ${cpu} CPU, ${memory} memory)`,
    };
  });

  const onChange = value => {
    const extras = get(jobProtocol, 'extras', {});
    const hivedScheduler = get(extras, 'hivedScheduler', {});
    const taskRoles = get(hivedScheduler, 'taskRoles', {});
    const taskRole = get(taskRoles, `${currentTaskRole}`, {});

    onJobProtocolChange({
      ...jobProtocol,
      extras: {
        ...extras,
        hivedScheduler: {
          ...hivedScheduler,
          taskRoles: {
            ...taskRoles,
            [currentTaskRole]: {
              ...taskRole,
              skuType: value,
            },
          },
        },
      },
    });
  };

  const onSkuTypeChange = (_, item) => {
    onChange(item.key);
  };

  useEffect(() => {
    if (skuType != null) {
      const selected = skuOptions.find(option => option.key === skuType);
      if (selected == null) {
        onChange(null);
      }
    } else if (!isEmpty(skuOptions)) {
      onChange(skuOptions[0].key);
    }
  }, [skuType, skuOptions]);

  return (
    <Dropdown
      placeholder='Select SKU type'
      options={skuOptions}
      onChange={onSkuTypeChange}
      selectedKey={skuType}
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
