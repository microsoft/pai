import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Box, Flex, Row, Col } from '../../elements';
import { JobName } from './job-name';
import { VirtualCluster } from './virtual-cluster';
import { RetryCount } from './retry-count';
import { FormItem, FormSection } from '../form-page';
import { MoreInfo } from '../more-info';

const PureJobInformation = ({ expandedFlag }) => {
  const [advancedFlag, handleAdvancedFlag] = useState(false);

  const toggleMoreInfo = () => handleAdvancedFlag(!advancedFlag);

  return (
    <FormSection title='Job Information' mb='l1'>
      <Row gutter={20}>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='Job name'>
            <JobName />
          </FormItem>
        </Col>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='Virtual cluster'>
            <VirtualCluster />
          </FormItem>
        </Col>
      </Row>
      {advancedFlag ? (
        <Row gutter={20}>
          <Col span={{ _: 12, sm: 12, md: 12, lg: expandedFlag ? 6 : 4 }}>
            <FormItem label='Retry count'>
              <RetryCount />
            </FormItem>
          </Col>
        </Row>
      ) : null}
      <MoreInfo isShow={advancedFlag} onChange={toggleMoreInfo} />
    </FormSection>
  );
};

export const JobInformation = connect(({ global }) => ({
  expandedFlag: global.expandedFlag,
}))(PureJobInformation);
