// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import { FormSpinButton } from '../controls/form-spin-button';
import { JobProtocol } from '../../models/job-protocol';
import PropTypes from 'prop-types';

const RETRY_COUNT_MIN = 0;

const PureRetryCount = ({ jobProtocol, onJobProtocolChange }) => {
  const jobRetryCount = get(jobProtocol, 'jobRetryCount', 0);

  const onChange = value => {
    onJobProtocolChange(
      new JobProtocol({ ...jobProtocol, jobRetryCount: value }),
    );
  };

  return (
    <FormSpinButton
      min={RETRY_COUNT_MIN}
      step={1}
      value={jobRetryCount}
      onChange={onChange}
    />
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const RetryCount = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureRetryCount);

PureRetryCount.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
