// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { cloneDeep, isNil, get } from 'lodash';
import PropTypes from 'prop-types';
import { Toggle } from 'office-ui-fabric-react';
import { Row, Col } from '../../elements';
import theme from '../../theme';

import { FormItem, FormSection } from '../form-page';
import { TabForm } from './tab-form';
import { TaskRoleName } from './task-role-name';
import { DockerImage } from './docker-image';
import { Instances } from './instances';
import { SKUCount } from './SKU-count';
import { SKUType } from './SKU-type';
import { CommandSection } from './command-section';
import { TaskRetryCount } from './task-retry-count';
import { MinFailedInstances } from './min-failed-instances';
import { MinSucceedInstances } from './min-succeed-instances';
import { MoreInfo } from '../more-info';
import { JobTaskRole } from '../../models/job-task-role';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';
import { PortsList } from './ports-list';
import { ContainerSizeSection } from './container-size-section';
import config from '../../../config/webportal.config';

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
    if (get(jobProtocol, `taskRoles.${currentTaskRole}`)) {
      const updatedTaskRole = JobTaskRole.fromProtocol(
        jobProtocol,
        currentTaskRole,
      );
      setJobTaskRole(updatedTaskRole);
    }
  }, [jobProtocol, currentTaskRole]);

  const onTaskRoleChange = (itemKey, propValue) => {
    const updatedJobTaskRole = new JobTaskRole({ ...jobTaskRole });
    updatedJobTaskRole[itemKey] = propValue;

    const [
      updatedTaskRole,
      updatedHivedTaskRole,
    ] = updatedJobTaskRole.convertToProtocolFormat();

    const updatedTaskRoles = cloneDeep(jobProtocol.taskRoles);
    const updatedExtras = cloneDeep(jobProtocol.extras);
    if (isNil(updatedExtras.hivedScheduler)) {
      updatedExtras.hivedScheduler = {};
    }
    const updatedHivedScheduler = updatedExtras.hivedScheduler;
    if (isNil(updatedHivedScheduler.taskRoles)) {
      updatedHivedScheduler.taskRoles = {};
    }
    const updatedHivedTaskRoles = updatedHivedScheduler.taskRoles;

    updatedTaskRoles[currentTaskRole] = updatedTaskRole;
    updatedHivedTaskRoles[currentTaskRole] = updatedHivedTaskRole;

    onJobProtocolChange({
      ...jobProtocol,
      taskRoles: updatedTaskRoles,
      extras: updatedExtras,
    });
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
      {config.launcherScheduler === 'hivedscheduler' ? (
        <Row gutter={20}>
          <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
            <FormItem label='SKU count per instance'>
              <SKUCount
                value={jobTaskRole.hivedSku}
                onChange={onTaskRoleChange}
              />
            </FormItem>
          </Col>
          <Col span={{ _: 12, sm: 12, md: 6, lg: expandedFlag ? 6 : 4 }}>
            <FormItem label='SKU type'>
              <SKUType
                value={jobTaskRole.hivedSku}
                onChange={onTaskRoleChange}
              />
            </FormItem>
          </Col>
        </Row>
      ) : (
        <ContainerSizeSection
          value={jobTaskRole.containerSize}
          onChange={onTaskRoleChange}
          isContainerSizeEnabled={jobTaskRole.isContainerSizeEnabled}
        />
      )}
      <Row>
        <Col span={12}>
          <FormItem label='Command'>
            <CommandSection
              value={jobTaskRole.commands}
              onChange={onTaskRoleChange}
            />
          </FormItem>
        </Col>
      </Row>
      {advancedFlag && (
        <>
          <Row gutter={20}>
            <Col span={{ _: 12, sm: 12, md: 12, lg: expandedFlag ? 12 : 4 }}>
              <FormItem label='Ports'>
                <PortsList
                  ports={jobTaskRole.ports}
                  onChange={onTaskRoleChange}
                />
              </FormItem>
            </Col>
          </Row>
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
        </>
      )}
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
