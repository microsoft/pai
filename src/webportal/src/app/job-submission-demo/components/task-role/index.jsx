// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Row, Col } from '../../elements';
import { FormItem, FormSection } from '../form-page';
import { DockerImage } from './docker-image';
import { Instance } from './instances';
import { SKUCount } from './SKU-count';
import { SKUType } from './SKU-type';
import { TabForm } from './tab-form';
import { CommandSection } from './command-section';
import { TaskRetryCount } from './task-retry-count';
import { MinFailedInstances } from './min-failed-instances';
import { MinSucceedInstances } from './min-succeed-instances';
import { MoreInfo } from '../more-info';
import { TaskRoleName } from './task-role-name';
import PropTypes from 'prop-types';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';

const PureTaskRole = ({ expandedFlag }) => {
  const [advancedFlag, handleAdvancedFlag] = useState(false);

  const toggleMoreInfo = () => handleAdvancedFlag(!advancedFlag);

  return (
    <FormSection title={<TabForm />} tooltip={PROTOCOL_TOOLTIPS.taskRole}>
      <Row gutter={20}>
        <Col span={{ _: 12, sm: 12, md: 12, lg: expandedFlag ? 12 : 4 }}>
          <FormItem label='Task role name'>
            <TaskRoleName />
          </FormItem>
        </Col>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem
            label='Docker image'
            tooltip={PROTOCOL_TOOLTIPS.dockerImage}
          >
            <DockerImage />
          </FormItem>
        </Col>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='Instances'>
            <Instance />
          </FormItem>
        </Col>
      </Row>
      <Row gutter={20}>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='SKU count'>
            <SKUCount />
          </FormItem>
        </Col>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='SKU type'>
            <SKUType />
          </FormItem>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <FormItem label='Command'>
            <CommandSection />
          </FormItem>
        </Col>
      </Row>
      {advancedFlag ? (
        <Row gutter={20}>
          <Col span={{ _: 12, sm: 12, md: 12, lg: expandedFlag ? 12 : 4 }}>
            <FormItem
              label='Task retry count'
              tooltip={PROTOCOL_TOOLTIPS.policy}
>
              <TaskRetryCount />
            </FormItem>
          </Col>
          <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
            <FormItem
              label='Min failed instances'
              tooltip={PROTOCOL_TOOLTIPS.policy}
            >
              <MinFailedInstances />
            </FormItem>
          </Col>
          <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
            <FormItem
              label='Min succeed instances'
              tooltip={PROTOCOL_TOOLTIPS.policy}
            >
              <MinSucceedInstances />
            </FormItem>
          </Col>
        </Row>
      ) : null}
      <MoreInfo isShow={advancedFlag} onChange={toggleMoreInfo} />
    </FormSection>
  );
};

export const TaskRole = connect(({ global, jobInformation }) => ({
  expandedFlag: global.expandedFlag,
  jobProtocol: jobInformation.jobProtocol,
}))(PureTaskRole);

PureTaskRole.propTypes = {
  expandedFlag: PropTypes.bool,
};
