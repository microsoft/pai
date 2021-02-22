// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { PrimaryButton } from 'office-ui-fabric-react';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const PureSubmissionSection = ({ jobProtocol, ...restProps }) => {
  const onSubmit = () => {
    console.log('submit jobProtocol:', jobProtocol);
  };

  return (
    <>
      <PrimaryButton onClick={onSubmit}>Submit</PrimaryButton>
    </>
  );
};

export const SubmissionSection = connect(({ jobInformation }) => ({
  jobProtocol: jobInformation.jobProtocol,
}))(PureSubmissionSection);

PureSubmissionSection.propTypes = {
  jobProtocol: PropTypes.object,
};
