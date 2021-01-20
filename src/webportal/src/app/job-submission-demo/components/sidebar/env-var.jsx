import React from 'react';
import {
  DetailsList,
  CheckboxVisibility,
  DetailsListLayoutMode,
  SelectionMode,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { Box, Code } from '../../elements';
import { PAI_ENV_VAR } from '../../utils/constants';
import { SidebarCard } from './sidebar-card';

const columns = [
  {
    key: 'key',
    name: 'Key',
    fieldName: 'key',
    isMultiline: true,
    minWidth: 200,
  },
  {
    key: 'desc',
    name: 'Description',
    isMultiline: true,
    fieldName: 'desc',
    minWidth: 200,
  },
];

export const EnvVar = () => {
  return (
    <SidebarCard title='PAI environment variables'>
      <Box>
        <Box fontSize='s2'>
          You could reference these PAI Environment Variables in command by
        </Box>
        <Code fontSize='s2' color='dark-red' bg='black-05'>
          {'$envKey'}
        </Code>
        .
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
    </SidebarCard>
  );
};
