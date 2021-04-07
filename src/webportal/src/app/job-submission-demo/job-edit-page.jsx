// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react';
import { Flex, Box } from './elements';
import { TemplateSelection } from './components/template-selection';
import { SaveTemplateDialog } from './components/save-template-dialog';
import { JobInformation } from './components/job-information';
import { TaskRole } from './components/task-role';
import { Sidebar } from './components/sidebar';
import { submitJob } from './utils/conn';
import config from '../config/webportal.config';

const loginUser = cookies.get('user');

const PureJobEditPage = ({ jobProtocol, fetchVirtualClusters }) => {
  const [hideDialog, setHideDialog] = useState(true);

  const toggleHideDialog = () => {
    setHideDialog(!hideDialog);
  };

  // fetch available virtual clusters by login user's authority
  useEffect(() => {
    fetchVirtualClusters(loginUser);
  }, []);

  const onSubmit = async e => {
    e.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      await submitJob(protocol.toYaml());
      window.location.href = `/job-detail.html?username=${loginUser}&jobName=${protocol.name}`;
    } catch (err) {
      alert(err);
    }
  };

  return (
    <>
      <Flex flex='1 1 100%'>
        {/* left */}
        <Box flex='1 1 100%'>
          <Box bg='white'>
            <TemplateSelection />
          </Box>
          <Box>
            <JobInformation />
          </Box>
          <Box>
            <TaskRole />
          </Box>
        </Box>
        {/* right */}
        <Sidebar />
      </Flex>
      <Flex justifyContent='flex-end' padding='m' marginTop='m' bg='white'>
        <PrimaryButton onClick={onSubmit}>Submit</PrimaryButton>
        {config.saveTemplate === 'true' && (
          <DefaultButton onClick={toggleHideDialog}>
            Save to Templates
          </DefaultButton>
        )}
      </Flex>
      <SaveTemplateDialog
        hideDialog={hideDialog}
        toggleHideDialog={toggleHideDialog}
      />
    </>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  fetchVirtualClusters: loginUser =>
    dispatch({ type: 'fetchVirtualClusters', payload: { loginUser } }),
});

export const JobEditPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureJobEditPage);

PureJobEditPage.propTypes = {
  jobProtocol: PropTypes.object,
  fetchVirtualClusters: PropTypes.func,
};
