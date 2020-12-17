import React from 'react';
import PropTypes from 'prop-types';

import { Text, Stack, StackItem } from 'office-ui-fabric-react';

import { ExportConfig } from './export-config';
import { ImportConfig } from './import-config';

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
        <ExportConfig protocolYaml={protocolYaml} />
        <ImportConfig onChange={onChange} />
      </Stack>
    </Stack>
  );
};

YamlEditTopBar.propTypes = {
  protocolYaml: PropTypes.string,
  onChange: PropTypes.func,
  history: PropTypes.object,
};
