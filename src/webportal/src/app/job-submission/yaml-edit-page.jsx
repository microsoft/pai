// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { isNil, isEmpty, get } from 'lodash';
import Context from './components/context';
import PropTypes from 'prop-types';

import t from '../components/tachyons.scss';
import {
  Text,
  Label,
  Fabric,
  Stack,
  ColorClassNames,
  FontWeights,
  MessageBar,
  MessageBarType,
  DefaultButton,
  PrimaryButton,
  StackItem,
} from 'office-ui-fabric-react';
import MonacoEditor from '../components/monaco-editor';
import { SpinnerLoading } from '../components/loading';
import { YamlEditTopBar } from './components/yamledit-topbar/yamledit-topbar';
// models
import { JobProtocol } from './models/job-protocol';

export const YamlEditPage = ({ isSingle, history, yamlText, setYamlText }) => {
  const [jobData, setJobData] = useState({});
  const [jobProtocol, setJobProtocol] = useState({});
  const [extras, setExtras] = useState({});
  const [loading, setLoading] = useState(false);
  if (loading) {
    return <SpinnerLoading />;
  }
  return (
    <Fabric style={{ height: '100%', overflowX: 'auto' }}>
      <Stack
        style={{ root: { height: '100%', minWidth: 1000, minHeight: 720 } }}
        verticalAlign='space-between'
        gap='l1'
        padding='l1'
      >
        <StackItem disableShrink>
          <YamlEditTopBar
            jobData={jobData}
            jobProtocol={jobProtocol}
            onChange={(
              updatedJobInfo,
              updatedTaskRoles,
              updatedParameters,
              updatedExtras,
            ) => {}}
            extras={extras}
            history={history}
            setYamlText={setYamlText}
          />
        </StackItem>
        <StackItem>
          <MessageBar messageBarType={MessageBarType.success}>
            Success MessageBar
          </MessageBar>
        </StackItem>
        <StackItem>
          <MonacoEditor
            className={t.overflowHidden}
            monacoProps={{
              width: 1000,
              height: 720,
              theme: 'vs',
              options: {
                wordWrap: 'on',
              },
            }}
          />
        </StackItem>
        <Stack
          horizontal
          gap='m'
          verticalAlign='baseline'
          horizontalAlign='space-between'
        >
          <StackItem>
            <DefaultButton
              text='Back'
              styles={{
                root: [ColorClassNames.neutralTertiaryAltBackground],
                rootHovered: [ColorClassNames.neutralTertiaryBackground],
              }}
            />
          </StackItem>
          <StackItem>
            <PrimaryButton text='Submit' />
          </StackItem>
        </Stack>
      </Stack>
    </Fabric>
  );
};

YamlEditPage.propTypes = {
  isSingle: PropTypes.bool,
  history: PropTypes.object,
  yamlText: PropTypes.string,
  setYamlText: PropTypes.func,
};
