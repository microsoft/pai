// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useCallback, useContext, useMemo } from 'react';
import { Dropdown, Stack } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { BasicSection } from './basic-section';
import { CSpinButton } from './customized-components';
import { FormShortSection } from './form-page';
import { PROTOCOL_TOOLTIPS } from '../utils/constants';
import Context from './context';

export const HivedSkuSection = React.memo(props => {
  const { value, onChange } = props;
  const { skuNum, skuType } = value;
  const { hivedSkuTypes } = useContext(Context);

  const skuOptions = useMemo(
    () =>
      Object.entries(hivedSkuTypes).reduce((options, skuType) => {
        const [sku, { gpu, cpu, memory }] = skuType;
        return [
          ...options,
          {
            key: sku,
            text: `${sku} (${gpu} GPU, ${cpu} CPU, ${memory} memory)`,
          },
        ];
      }, []),
    [hivedSkuTypes],
  );

  const _onChange = (keyName, newValue) => {
    if (onChange !== undefined) {
      onChange({ ...value, [keyName]: newValue });
    }
  };

  const _onSkuTypeChange = useCallback(
    (_, item) => {
      _onChange('skuType', item.key);
    },
    [_onChange],
  );

  return (
    <BasicSection
      sectionLabel='Resources SKU'
      sectionTooltip={PROTOCOL_TOOLTIPS.hivedSkuType}
    >
      <FormShortSection gap='m'>
        <Stack horizontal verticalAlign='baseline'>
          <div style={{ width: '20%' }}>SKU count</div>
          <Stack.Item grow>
            <CSpinButton
              value={skuNum}
              min={1}
              onChange={value => _onChange('skuNum', value)}
            />
          </Stack.Item>
        </Stack>
        <Stack horizontal verticalAlign='baseline'>
          <div style={{ width: '20%' }}>SKU type</div>
          <Stack.Item grow>
            <Dropdown
              placeholder='Select SKU type'
              options={skuOptions}
              onChange={_onSkuTypeChange}
              selectedKey={skuType}
            />
          </Stack.Item>
        </Stack>
      </FormShortSection>
    </BasicSection>
  );
});

HivedSkuSection.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func,
};
