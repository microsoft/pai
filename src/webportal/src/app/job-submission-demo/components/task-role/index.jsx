import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Box, Flex, Row, Col } from '../../elements';
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

const PureTaskRole = ({ expandedFlag, jobProtocol }) => {
  const [advancedFlag, handleAdvancedFlag] = useState(false);

  const toggleMoreInfo = () => handleAdvancedFlag(!advancedFlag);

  return (
    <FormSection title={<TabForm />}>
      <Row gutter={20}>
        <Col span={{ _: 12, sm: 12, md: 12, lg: expandedFlag ? 12 : 4 }}>
          <FormItem label='Task role name'>
            <TaskRoleName />
          </FormItem>
        </Col>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='Docker image'>
            <DockerImage />
          </FormItem>
        </Col>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='instances'>
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
            <FormItem label='Task retry count'>
              <TaskRetryCount />
            </FormItem>
          </Col>
          <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
            <FormItem label='Min failed instances'>
              <MinFailedInstances />
            </FormItem>
          </Col>
          <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
            <FormItem label='Min succeed instances'>
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
