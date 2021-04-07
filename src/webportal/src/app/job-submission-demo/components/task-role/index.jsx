// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { cloneDeep, get, set, isEmpty, isNil } from 'lodash';
import { Row, Col } from '../../elements';
import { FormItem, FormSection } from '../form-page';
import { DockerImage } from './docker-image';
import { Instances } from './instances';
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
import { Toggle } from 'office-ui-fabric-react';
import theme from '../../theme';
import { JobTaskRole } from '../../models/job-task-role';

const PureTaskRole = ({
  jobProtocol,
  currentTaskRole,
  expandedFlag,
  onJobProtocolChange,
}) => {
  const [jobTaskRole, setJobTaskRole] = useState(
    JobTaskRole.fromProtocol(jobProtocol, currentTaskRole),
  );
  const [isUseCustomizedDocker, toggleUseCustomizedDocker] = useState(false);
  const [advancedFlag, setAdvancedFlag] = useState(false);

  useEffect(() => {
    const updatedTaskRole = JobTaskRole.fromProtocol(
      jobProtocol,
      currentTaskRole,
    );
    console.log(jobProtocol, updatedTaskRole);
    setJobTaskRole(updatedTaskRole);
  }, [jobProtocol]);

  const onTaskRoleChange = (itemKey, propValue) => {
    const updatedTaskRoles = cloneDeep(jobProtocol.taskRoles);
    const updatedTaskRole = updatedTaskRoles[currentTaskRole];
    set(updatedTaskRole, itemKey, propValue);
    onJobProtocolChange({ ...jobProtocol, taskRoles: updatedTaskRoles });
  };

  const onExtrasChange = (itemKey, propValue) => {
    const updatedExtras = cloneDeep(jobProtocol.extras);
    if (isNil(updatedExtras.hivedScheduler)) {
      updatedExtras.hivedScheduler = {};
    }
    const updatedHivedScheduler = updatedExtras.hivedScheduler;
    if (isNil(updatedHivedScheduler.taskRoles)) {
      updatedHivedScheduler.taskRoles = {};
    }
    const updatedTaskRoles = updatedHivedScheduler.taskRoles;
    if (isNil(updatedTaskRoles[currentTaskRole])) {
      updatedTaskRoles[currentTaskRole] = {};
    }
    const updatedTaskRole = updatedTaskRoles[currentTaskRole];
    updatedTaskRole[itemKey] = propValue;
    console.log(updatedExtras);
    onJobProtocolChange({ ...jobProtocol, extras: updatedExtras });
  };

  const onCustomizedImageEnable = (_, checked) => {
    if (!checked) {
      onJobProtocolChange(jobProtocol);
    }
    toggleUseCustomizedDocker(checked);
  };

  const toggleMoreInfo = () => {
    setAdvancedFlag(!advancedFlag);
  };

  const { space } = theme;

  return (
    <FormSection
      title='Task role'
      extra={<TabForm />}
      tooltip={PROTOCOL_TOOLTIPS.taskRole}
    >
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
            extra={
              <Toggle
                checked={isUseCustomizedDocker}
                label='Custom'
                inlineLabel={true}
                styles={{
                  label: { order: -1, marginRight: space.s1 },
                  root: { marginBottom: 0 },
                }}
                onChange={onCustomizedImageEnable}
              />
            }
          >
            <DockerImage
              value={jobTaskRole.dockerImage}
              onChange={onTaskRoleChange}
              customized={isUseCustomizedDocker}
            />
          </FormItem>
        </Col>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='Instances'>
            <Instances
              value={jobTaskRole.instances}
              onChange={onTaskRoleChange}
            />
          </FormItem>
        </Col>
      </Row>
      <Row gutter={20}>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='SKU count'>
            <SKUCount value={jobTaskRole.skuNum} onChange={onExtrasChange} />
          </FormItem>
        </Col>
        <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
          <FormItem label='SKU type'>
            <SKUType value={jobTaskRole.skuType} onChange={onExtrasChange} />
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
              <TaskRetryCount
                value={jobTaskRole.taskRetryCount}
                onChange={onTaskRoleChange}
              />
            </FormItem>
          </Col>
          <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
            <FormItem
              label='Min failed instances'
              tooltip={PROTOCOL_TOOLTIPS.policy}
            >
              <MinFailedInstances
                value={jobTaskRole.completion}
                onChange={onTaskRoleChange}
              />
            </FormItem>
          </Col>
          <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
            <FormItem
              label='Min succeed instances'
              tooltip={PROTOCOL_TOOLTIPS.policy}
            >
              <MinSucceedInstances
                value={jobTaskRole.completion}
                onChange={onTaskRoleChange}
              />
            </FormItem>
          </Col>
        </Row>
      ) : null}
      <MoreInfo isShow={advancedFlag} onChange={toggleMoreInfo} />
    </FormSection>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
  currentTaskRole: state.JobExtraInfo.currentTaskRole,
  expandedFlag: state.SideInfo.expandedFlag,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const TaskRole = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureTaskRole);

PureTaskRole.propTypes = {
  jobProtocol: PropTypes.object,
  currentTaskRole: PropTypes.string,
  expandedFlag: PropTypes.bool,
  onJobProtocolChange: PropTypes.func,
};
