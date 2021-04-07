// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { FormSection } from '../form-page';
import { Box } from '../../elements';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';
import { JobSSH } from './job-ssh';

export const Tools = () => {
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
