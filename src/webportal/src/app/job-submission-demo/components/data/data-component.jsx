// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import { FormSection } from '../form-page';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';
import { Box, Code } from '../../elements';
import { TeamStorage } from './team-storage';

export const DataComponent = () => {
  return (
    <FormSection title='Data' tooltip={PROTOCOL_TOOLTIPS.data}>
      <Box fontSize='s2'>
        The data configured here will be mounted or copied into job container.
        You could use them with <Code>{'Container Path'}</Code> value below.
      </Box>
      <TeamStorage />
    </FormSection>
  );
};
