// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { PrimaryButton } from 'office-ui-fabric-react';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const PureSubmissionSection = ({ jobProtocol }) => {
  const onSubmit = () => {
    // TO DO: command trim()
    console.log('submit jobProtocol:', jobProtocol);
  };

  return (
    <>
      <PrimaryButton onClick={onSubmit}>Submit</PrimaryButton>
    </>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = {};

export const SubmissionSection = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureSubmissionSection);

PureSubmissionSection.propTypes = {
  jobProtocol: PropTypes.object,
};
