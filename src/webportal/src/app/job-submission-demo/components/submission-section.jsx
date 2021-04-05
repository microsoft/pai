// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';
import config from '../../config/webportal.config';
import { Flex, Box } from '../elements';
import { SaveTemplateDialog } from './save-template-dialog';
import { submitJob } from '../utils/conn';

const user = cookies.get('user');

const PureSubmissionSection = ({ jobProtocol }) => {
  const [hideDialog, setHideDialog] = useState(true);

  const toggleHideDialog = () => {
    setHideDialog(!hideDialog);
  };

  const onSubmit = async e => {
    e.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      await submitJob(protocol.toYaml());
      window.location.href = `/job-detail.html?username=${user}&jobName=${protocol.name}`;
    } catch (err) {
      alert(err);
    }
  };

  return (
    <Box>
      <Flex>
        <PrimaryButton onClick={onSubmit}>Submit</PrimaryButton>
        {config.saveTemplate === 'true' && (
          <Box mx={2}>
            <DefaultButton onClick={toggleHideDialog}>
              Save to Templates
            </DefaultButton>
          </Box>
        )}
      </Flex>
      <SaveTemplateDialog
        hideDialog={hideDialog}
        toggleHideDialog={toggleHideDialog}
      />
    </Box>
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
