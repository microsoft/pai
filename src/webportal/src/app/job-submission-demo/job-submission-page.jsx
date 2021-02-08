import React from 'react';
import { connect } from 'react-redux';
import { JobEditPage } from './job-edit-page';
import { SubmissionSection } from './components/submission-section';
import { Box, Flex } from './elements';

const UnwrapperedJobSubmissionPage = ({ currentTabKey }) => {
  return (
    <Flex flexDirection='column' height='100%' p='l1'>
      <Flex flex={1} mb='l1'>
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
}))(UnwrapperedJobSubmissionPage);
