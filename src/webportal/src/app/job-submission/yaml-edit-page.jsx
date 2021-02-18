// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import { isEmpty, debounce } from 'lodash';
import PropTypes from 'prop-types';

import t from '../components/tachyons.scss';
import {
  Fabric,
  Stack,
  ColorClassNames,
  MessageBar,
  MessageBarType,
  DefaultButton,
  PrimaryButton,
  StackItem,
} from 'office-ui-fabric-react';
import MonacoEditor from '../components/monaco-editor';
import { YamlEditTopBar } from './components/yamledit-topbar/yamledit-topbar';
// models
import { JobProtocol } from './models/job-protocol';
import Card from '../components/card';
// funcs
import { submitJob } from './utils/conn';

const JOB_PROTOCOL_SCHEMA_URL =
  'https://github.com/microsoft/openpai-protocol/blob/master/schemas/v2/schema.yaml';

const user = cookies.get('user');

export const YamlEditPage = ({ history }) => {
  const [protocolYaml, setProtocolYaml] = useState(
    'Paste or import your yaml here...',
  );
  const [validStatus, setValidStatus] = useState({
    message: 'Warning: Not init with yaml yet',
    barType: MessageBarType.warning,
  });

  useEffect(() => {
    const valid = JobProtocol.validateFromYaml(protocolYaml);
    if (!isEmpty(valid)) {
      if (protocolYaml !== 'Paste or import your yaml here...')
        setValidStatus({ message: valid, barType: MessageBarType.error });
    } else {
      setValidStatus({
        message: 'Success: Validation completed successfully',
        barType: MessageBarType.success,
      });
    }
  }, [protocolYaml]);

  const _onTextChange = (text) => {
    setProtocolYaml(text);
  };

  const _submitJob = async (event) => {
    event.preventDefault();
    try {
      await submitJob(protocolYaml);
      window.location.href = `/job-detail.html?username=${user}&jobName=${
        yaml.safeLoad(protocolYaml).name
      }`;
    } catch (err) {
      alert(err);
    }
  };

  return (
    <Fabric style={{ height: '100%', overflowX: 'auto' }}>
      <Stack
        style={{
          height: '100%',
          width: '100%',
        }}
        verticalAlign='space-between'
        gap='l1'
        padding='l1'
      >
        <StackItem disableShrink>
          <YamlEditTopBar
            protocolYaml={protocolYaml}
            onChange={setProtocolYaml}
          />
        </StackItem>
        <Stack gap='s1' style={{ flex: 1 }}>
          <MessageBar messageBarType={validStatus.barType}>
            {validStatus.message}
          </MessageBar>
          <MonacoEditor
            className={t.overflowHidden}
            style={{ flex: '1 1 100%' }}
            monacoProps={{
              theme: 'vs',
              onChange: debounce(_onTextChange, 100),
              value: protocolYaml,
              options: {
                language: 'yaml',
                wordWrap: 'on',
              },
            }}
          />
        </Stack>
        <Card>
          <Stack horizontal gap='m' horizontalAlign='space-between'>
            <StackItem>
              <DefaultButton
                text='Back'
                styles={{
                  root: [ColorClassNames.neutralTertiaryAltBackground],
                  rootHovered: [ColorClassNames.neutralTertiaryBackground],
                }}
                onClick={() => {
                  history.push('/');
                }}
              />
            </StackItem>
            <Stack horizontal gap='l1'>
              <DefaultButton
                styles={{
                  root: [ColorClassNames.neutralTertiaryAltBackground],
                  rootHovered: [ColorClassNames.neutralTertiaryBackground],
                }}
                onClick={() => window.open(JOB_PROTOCOL_SCHEMA_URL)}
                text='Protocol Schema'
              />
              <PrimaryButton
                onClick={_submitJob}
                disabled={validStatus.barType !== MessageBarType.success}
                text='Submit'
              />
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Fabric>
  );
};

YamlEditPage.propTypes = {
  history: PropTypes.object.isRequired,
};
