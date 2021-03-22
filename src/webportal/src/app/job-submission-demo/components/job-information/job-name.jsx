// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import { TextField } from 'office-ui-fabric-react';
import { JobProtocol } from '../../models/job-protocol';
import PropTypes from 'prop-types';

const PureJobName = ({ jobProtocol, onJobProtocolChange }) => {
  const { name } = jobProtocol;

  const onChange = (_, val) => {
    onJobProtocolChange(new JobProtocol({ ...jobProtocol, name: val }));
  };

  return <TextField value={name} onChange={debounce(onChange, 200)} />;
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const JobName = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureJobName);

PureJobName.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
