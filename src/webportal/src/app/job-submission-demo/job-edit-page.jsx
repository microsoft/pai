import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { isNil, get } from 'lodash';
import { JobInformation } from './components/job-information';
import { TaskRole } from './components/task-role';
import { Sidebar } from './components/sidebar';
import { Flex, Box } from './elements';
import { fetchJobConfig } from './utils/conn';
import { JobProtocol } from './models/job-protocol';
import PropTypes from 'prop-types';

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

const PureJobEditPage = ({ dispatch }) => {
  useEffect(() => {
    let suffix = Date.now().toString(16);
    suffix = suffix.substring(suffix.length - 6);
    let name = `${loginUser}_${suffix}`;
    name = name + getChecksum(name);
    dispatch({
      type: 'SAVE_JOBPROTOCOL',
      payload: new JobProtocol({
        name,
        defaults: { virtualCluster: 'default' },
        extras: {
          hivedScheduler: {
            taskRoles: { taskrole: { skuNum: 1, skuType: 'GENERIC-WORKER' } },
          },
        },
        prerequisites: [
          {
            type: 'dockerimage',
            uri: 'openpai/standard:python_3.6-pytorch_1.2.0-gpu',
            name: 'docker_image_0',
          },
        ],
        taskRoles: {
          taskrole: {
            completion: { minFailedInstances: 1 },
            dockerImage: 'docker_image_0',
            instances: 1,
            taskRetryCount: 0,
          },
        },
      }),
    });
  }, []);

  // fill protocol if cloned job or local storage
  useEffect(() => {
    const fillJobProtocol = jobConfig => {
      dispatch({
        type: 'SAVE_JOBPROTOCOL',
        payload: { ...jobConfig, name: generateJobName(jobConfig.name) },
      });
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

  // fetch available virtual clusters by login user's authority
  useEffect(() => {
    dispatch({
      type: 'fetchVirtualClusters',
      payload: { loginUser },
    });
  }, []);

  return (
    <>
      {/* left */}
      <Flex flexDirection='column' flex={1} minHeight={0} overFlow='hidden'>
        <Box>
          <JobInformation />
        </Box>
        <Box flex={1} minHeight={0} overFlow='auto'>
          <TaskRole />
        </Box>
      </Flex>
      {/* right */}
      <Sidebar />
    </>
  );
};

export const JobEditPage = connect(({ jobInformation, global }) => ({
  ...jobInformation,
  ...global,
}))(PureJobEditPage);

PureJobEditPage.propTypes = {
  dispatch: PropTypes.func,
};
