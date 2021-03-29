// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import config from '../../config/webportal.config';
import { Flex, Box } from '../elements';
import { SaveTemplateDialog } from './save-template-dialog';

const PureSubmissionSection = ({ jobProtocol }) => {
  const [hideDialog, setHideDialog] = useState(true);

  const toggleHideDialog = () => {
    setHideDialog(!hideDialog);
  };
  const onSubmit = () => {
    // TO DO: command trim()
    console.log('submit jobProtocol:', jobProtocol);
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
