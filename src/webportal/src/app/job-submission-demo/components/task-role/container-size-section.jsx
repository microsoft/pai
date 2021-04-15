// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Toggle } from 'office-ui-fabric-react';
import { Row, Col } from '../../elements';
import { FormItem } from '../form-page';
import { FormSpinButton } from '../controls/form-spin-button';
import theme from '../../theme';
import { getDefaultContainerSize } from '../../models/container-size';

const { space } = theme;

export const ContainerSizeSection = ({
  value,
  onChange,
  isContainerSizeEnabled,
}) => {
  const [isEnabled, setEnabled] = useState(isContainerSizeEnabled);

  const { cpu, memoryMB, gpu } = value;

  useEffect(() => {
    setEnabled(isContainerSizeEnabled);
  }, [isContainerSizeEnabled]);

  const onItemChange = (keyName, newValue) => {
    onChange('containerSize', { ...value, [keyName]: newValue });
  };

  const onGPUSkuChange = value => {
    onChange('containerSize', getDefaultContainerSize(value));
  };

  const onContainerSizeEnable = (_, checked) => {
    setEnabled(checked);
    onChange('containerSize', getDefaultContainerSize(gpu));
  };

  return (
    <Row gutter={20}>
      <Col span={{ _: 12, sm: 12, md: 4, lg: 4 }}>
        <FormItem
          label='GPU count'
          extra={
            <Toggle
              checked={isEnabled}
              label='Custom'
              inlineLabel={true}
              styles={{
                label: { order: -1, marginRight: space.s1 },
                root: { marginBottom: 0 },
              }}
              onChange={onContainerSizeEnable}
            />
          }
        >
          <FormSpinButton
            value={gpu}
            min={0}
            onChange={
              isEnabled ? value => onItemChange('gpu', value) : onGPUSkuChange
            }
          />
        </FormItem>
      </Col>
      <Col span={{ _: 12, sm: 12, md: 4, lg: 4 }}>
        <FormItem label='CPU vcore count'>
          <FormSpinButton
            disabled={!isEnabled}
            value={cpu}
            min={0}
            onChange={value => onItemChange('cpu', value)}
          />
        </FormItem>
      </Col>
      <Col span={{ _: 12, sm: 12, md: 4, lg: 4 }}>
        <FormItem label='Memory (MB)'>
          <FormSpinButton
            disabled={!isEnabled}
            value={memoryMB}
            min={0}
            onChange={value => onItemChange('memoryMB', value)}
          />
        </FormItem>
      </Col>
    </Row>
  );
};

ContainerSizeSection.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  isContainerSizeEnabled: PropTypes.bool.isRequired,
};
