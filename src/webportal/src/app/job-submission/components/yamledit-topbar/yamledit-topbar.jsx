import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

import { Text, Stack, StackItem } from 'office-ui-fabric-react';

import { ExportConfig } from './export-config';
import { ImportConfig } from './import-config';

export const YamlEditTopBar = ({
  jobData,
  jobProtocol,
  onChange,
  extras,
  isSingle,
  history,
  setYamlText,
}) => {
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
        <ExportConfig jobData={jobData} jobProtocol={jobProtocol} />
        <ImportConfig
          extras={extras}
          onChange={onChange}
          isSingle={isSingle}
          history={history}
          setYamlText={setYamlText}
        />
      </Stack>
    </Stack>
  );
};

YamlEditTopBar.propTypes = {
  jobData: PropTypes.object,
  jobProtocol: PropTypes.object,
  onChange: PropTypes.func,
  extras: PropTypes.object.isRequired,
  isSingle: PropTypes.bool,
  history: PropTypes.object,
  setYamlText: PropTypes.func,
};
