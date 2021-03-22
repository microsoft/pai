// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { JobInformation } from './components/job-information';
import { TaskRole } from './components/task-role';
import { Sidebar } from './components/sidebar';
import { Flex, Box } from './elements';
import PropTypes from 'prop-types';

const loginUser = cookies.get('user');

const PureJobEditPage = ({ fetchVirtualClusters }) => {
  // fetch available virtual clusters by login user's authority
  useEffect(() => {
    fetchVirtualClusters(loginUser);
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

const mapStateToProps = () => {};

const mapDispatchToProps = dispatch => ({
  fetchVirtualClusters: loginUser =>
    dispatch({ type: 'fetchVirtualClusters', payload: { loginUser } }),
});

export const JobEditPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureJobEditPage);

PureJobEditPage.propTypes = {
  fetchVirtualClusters: PropTypes.func,
};
