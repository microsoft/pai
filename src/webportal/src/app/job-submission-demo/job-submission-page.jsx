import React from 'react';
import { connect } from 'react-redux';
import { JobEditPage } from './job-edit-page';

const UnwrapperedJobSubmissionPage = ({ currentTabKey }) => {
  return (
    <JobEditPage />
  );
};

export const JobSubmissionPage = connect(({ global }) => ({
  currentTabKey: global.currentTabKey,
}))(UnwrapperedJobSubmissionPage);
