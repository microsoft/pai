// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { isEmpty, isNil, get } from 'lodash';
import PropTypes from 'prop-types';
import { Pivot, PivotItem } from 'office-ui-fabric-react';
import { Flex } from './elements';
import { Topbar } from './components/topbar';
import { JobEditPage } from './job-edit-page';
import { YamlEditPage } from './yaml-edit-page';
import { JobProtocol } from './models/job-protocol';
import { fetchJobConfig } from './utils/conn';
import { JobTaskRole } from './models/job-task-role';

const loginUser = cookies.get('user');

function getChecksum(str) {
  let res = 0;
  for (const c of str) {
    res ^= c.charCodeAt(0) & 0xff;
  }
  return res.toString(16);
}

function generateJobName(jobName) {
  let name = jobName;
  if (
    /_\w{8}$/.test(name) &&
    getChecksum(name.slice(0, -2)) === name.slice(-2)
  ) {
    name = name.slice(0, -9);
  }

  let suffix = Date.now().toString(16);
  suffix = suffix.substring(suffix.length - 6);
  name = `${name}_${suffix}`;
  name = name + getChecksum(name);
  return name;
}

const PureJobSubmissionPage = ({ onJobProtocolChange, onTaskRoleSelect }) => {
  const [currentTabKey, setCurrentTabKey] = useState('ui');

  useEffect(() => {
    let suffix = Date.now().toString(16);
    suffix = suffix.substring(suffix.length - 6);
    let name = `${loginUser}_${suffix}`;
    name = name + getChecksum(name);

    const updatedJobTaskRole = new JobTaskRole({ name: 'taskrole' });
    const [
      updatedTaskRole,
      updatedHivedTaskRole,
    ] = updatedJobTaskRole.convertToProtocolFormat();

    onJobProtocolChange(
      new JobProtocol({
        name,
        taskRoles: {
          [updatedJobTaskRole.name]: updatedTaskRole,
        },
        extras: {
          hivedScheduler: {
            taskRoles: {
              [updatedJobTaskRole.name]: updatedHivedTaskRole,
            },
          },
        },
      }),
    );
    onTaskRoleSelect(updatedJobTaskRole.name);
  }, []);

  // fill protocol if cloned job or local storage
  useEffect(() => {
    const fillJobProtocol = jobConfig => {
      const taskRoles = get(jobConfig, 'taskRoles', {});
      onJobProtocolChange(
        new JobProtocol({
          ...jobConfig,
          name: generateJobName(jobConfig.name),
        }),
      );
      onTaskRoleSelect(isEmpty(taskRoles) ? '' : Object.keys(taskRoles)[0]);
      if (get(jobConfig, 'extras.submitFrom')) {
        delete jobConfig.extras.submitFrom;
      }
    };
    const params = new URLSearchParams(window.location.search);
    if (params.get('op') === 'resubmit') {
      const jobName = params.get('jobName') || '';
      const user = params.get('user') || '';
      if (user && jobName) {
        fetchJobConfig(user, jobName)
          .then(jobConfig => fillJobProtocol(jobConfig))
          .catch(alert);
      }
    } else if (!isNil(window.localStorage.getItem('marketItem'))) {
      const jobConfig = JSON.parse(localStorage.getItem('marketItem'));
      fillJobProtocol(jobConfig);
      localStorage.removeItem('marketItem');
    }
  }, []);

  const handleTabChange = item => {
    setCurrentTabKey(item.props.itemKey);
    if (item.props.itemKey === 'yaml') {
      setTimeout(() => {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }, 0);
    }
  };

  return (
    <Flex flexDirection='column' p='l1' height='100%'>
      <Topbar />
      <Pivot onLinkClick={handleTabChange}>
        <PivotItem headerText='Web UI' itemKey='ui' />
        <PivotItem headerText='YAML Config' itemKey='yaml' />
      </Pivot>
      <Flex
        flex='1 1 100%'
        flexDirection='column'
        {...(currentTabKey === 'ui' ? {} : { display: 'none' })}
      >
        <JobEditPage />
      </Flex>
      <Flex
        flex='1 1 100%'
        flexDirection='column'
        {...(currentTabKey === 'yaml' ? {} : { display: 'none' })}
      >
        <YamlEditPage />
      </Flex>
    </Flex>
  );
};

const mapStateToProps = () => {};

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
  onTaskRoleSelect: key => {
    dispatch({
      type: 'SAVE_CURRENT_TASKROLE',
      payload: key,
    });
  },
});

export const JobSubmissionPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureJobSubmissionPage);

PureJobSubmissionPage.propTypes = {
  onJobProtocolChange: PropTypes.func,
  onTaskRoleSelect: PropTypes.func,
};
