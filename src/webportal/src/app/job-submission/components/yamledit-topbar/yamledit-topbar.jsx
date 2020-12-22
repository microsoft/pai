// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License

import React from 'react';
import PropTypes from 'prop-types';

import { Text, Stack, StackItem } from 'office-ui-fabric-react';

import { YamlEditExportConfig } from './yamledit-export-config';
import { YamlEditImportConfig } from './yamledit-import-config';

export const YamlEditTopBar = ({ protocolYaml, onChange }) => {
  return (
    <Stack horizontal horizontalAlign='space-between' padding='0 m'>
      <Stack horizontal gap='m' verticalAlign='baseline'>
        <StackItem>
          <Text variant='xLarge' styles={{ root: { fontWeight: 'semibold' } }}>
            Protocol Yaml Edit Page
          </Text>
        </StackItem>
      </Stack>
      <Stack horizontal gap='s1'>
        <YamlEditExportConfig protocolYaml={protocolYaml} />
        <YamlEditImportConfig onChange={onChange} />
      </Stack>
    </Stack>
  );
};

YamlEditTopBar.propTypes = {
  protocolYaml: PropTypes.string,
  onChange: PropTypes.func,
  history: PropTypes.object,
};
