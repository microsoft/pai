// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { JobEditPage } from './job-edit-page';
import { SubmissionSection } from './components/submission-section';
import { Flex } from './elements';
import PropTypes from 'prop-types';

const PureJobSubmissionPage = ({ currentTabKey }) => {
  return (
    <Flex flexDirection='column' p='l1'>
      <Flex mb='l1' minHeight={0}>
        <JobEditPage />
      </Flex>
      <Flex justifyContent='flex-end'>
        <SubmissionSection />
      </Flex>
    </Flex>
  );
};

export const JobSubmissionPage = connect(({ global }) => ({
  currentTabKey: global.currentTabKey,
}))(PureJobSubmissionPage);

PureJobSubmissionPage.propTypes = {
  currentTabKey: PropTypes.string,
};
