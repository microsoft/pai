// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import {
  DetailsList,
  CheckboxVisibility,
  DetailsListLayoutMode,
  SelectionMode,
} from 'office-ui-fabric-react';
import { Box, Code } from '../../elements';
import { FormSection } from '../form-page';
import { PAI_ENV_VAR } from '../../utils/constants';

const columns = [
  {
    key: 'key',
    name: 'Key',
    fieldName: 'key',
    isMultiline: true,
    minWidth: 130,
  },
  {
    key: 'desc',
    name: 'Description',
    fieldName: 'desc',
    isMultiline: true,
    minWidth: 130,
  },
];

export const EnvVar = () => {
  return (
    <FormSection title='PAI environment variables'>
      <Box>
        <Box fontSize='s2'>
          You could reference these PAI Environment Variables in command by
          <Code fontSize='s2' color='dark-red' bg='black-05'>
            {'$envKey'}
          </Code>
          .
        </Box>
      </Box>
      <Box>
        <DetailsList
          items={PAI_ENV_VAR}
          columns={columns}
          checkboxVisibility={CheckboxVisibility.hidden}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          selectionMode={SelectionMode.none}
          compact
        />
      </Box>
    </FormSection>
  );
};
