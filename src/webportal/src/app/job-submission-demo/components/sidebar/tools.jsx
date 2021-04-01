// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormSection } from '../form-page';
import { Box } from '../../elements';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';
import { JobSSH } from './job-ssh';

const PureTools = ({ jobProtocol, onJobProtocolChange }) => {
  return (
    <FormSection title='Tools' tooltip={PROTOCOL_TOOLTIPS.tools}>
      <Box>
        <Box fontSize='s2'>
          Tools section is used to configure the tools that are useful for jobs.
        </Box>
        <JobSSH />
      </Box>
    </FormSection>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const Tools = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureTools);

PureTools.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
