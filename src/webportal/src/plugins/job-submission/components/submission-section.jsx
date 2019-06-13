import React from 'react';
import {Stack, DefaultButton, PrimaryButton} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {Job} from '../models/job';

export const SubmissionSection = (props) => {
  return (
    <Stack horizontal gap='s1' horizontalAlign='center'>
      <PrimaryButton>Submit</PrimaryButton>
      <DefaultButton>Edit YAML</DefaultButton>
      <DefaultButton>Export</DefaultButton>
    </Stack>);
};

SubmissionSection.propTypes = {
  job: PropTypes.instanceOf(Job),
};
