/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import PropTypes from 'prop-types';
import { isNil, debounce, isEqual, isEmpty, cloneDeep } from 'lodash';
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Stack,
  DefaultButton,
  PrimaryButton,
  Text,
  getTheme,
  StackItem,
  Toggle,
  ColorClassNames,
} from 'office-ui-fabric-react';

import { JobProtocol } from '../models/job-protocol';
import { JobBasicInfo } from '../models/job-basic-info';
import { JobTaskRole } from '../models/job-task-role';
import { submitJob } from '../utils/conn';
import MonacoPanel from '../../components/monaco-panel';
import Card from '../../components/card';
import {
  populateProtocolWithDataAndTensorboard,
  getJobComponentsFromConfig,
  isValidUpdatedTensorBoardExtras,
} from '../utils/utils';
import Context from './context';
import { FormShortSection } from './form-page';

const JOB_PROTOCOL_SCHEMA_URL =
  'https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml';

const user = cookies.get('user');
const { palette } = getTheme();

const VALIDATION_ERROR_MESSAGE_ID = 'Submission Section';

export const SubmissionSection = props => {
  const {
    jobInformation,
    jobTaskRoles,
    parameters,
    secrets,
    extras,
    onChange,
    advanceFlag,
    onToggleAdvanceFlag,
    jobData,
    jobProtocol,
    setJobProtocol,
    history,
    isSingle,
  } = props;
  const [isEditorOpen, setEditorOpen] = useState(false);

  const [protocolYaml, setProtocolYaml] = useState('');
  const [validationMsg, setValidationMsg] = useState('');

  const monaco = useRef(null);

  const { vcNames, errorMessages, setErrorMessage } = useContext(Context);
  const params = new URLSearchParams(window.location.search);

  const _protocolAndErrorUpdate = protocol => {
    if (!isEqual(jobProtocol, protocol)) {
      setJobProtocol(protocol);
    }
    const newValidationMessage = JobProtocol.validateFromObject(protocol);
    if (newValidationMessage !== validationMsg) {
      setValidationMsg(newValidationMessage);
    }
    setErrorMessage(VALIDATION_ERROR_MESSAGE_ID, newValidationMessage);
  };

  useEffect(() => {
    const protocol = jobProtocol.getUpdatedProtocol(
      jobInformation,
      jobTaskRoles,
      parameters,
      secrets,
      extras,
    );
    _protocolAndErrorUpdate(protocol);
  }, [jobInformation, jobTaskRoles, parameters, secrets, jobProtocol, extras]);

  const _openEditor = async event => {
    event.preventDefault();
    setEditorOpen(true);

    const protocol = jobProtocol.getUpdatedProtocol(
      jobInformation,
      jobTaskRoles,
      parameters,
      secrets,
      extras,
    );
    _protocolAndErrorUpdate(protocol);
    try {
      await populateProtocolWithDataAndTensorboard(user, protocol, jobData);
      setProtocolYaml(protocol.toYaml());
    } catch (err) {
      alert(err);
    }
  };

  const _updatedComponent = protocolYaml => {
    const updatedJob = JobProtocol.fromYaml(protocolYaml);
    if (isNil(updatedJob)) {
      return;
    }

    setJobProtocol(updatedJob);
    if (onChange === undefined) {
      return;
    }

    const [
      updatedJobInformation,
      updatedTaskRoles,
      updatedParameters,
      updatedSecrets,
      updatedExtras,
    ] = getJobComponentsFromConfig(updatedJob, { vcNames });

    if (extras.tensorBoard) {
      const updatedTensorBoardExtras = updatedExtras.tensorBoard || {};
      if (
        !isValidUpdatedTensorBoardExtras(
          extras.tensorBoard,
          updatedTensorBoardExtras,
        )
      ) {
        updatedExtras.tensorBoard = extras.tensorBoard;
      }
    }

    onChange(
      updatedJobInformation,
      updatedTaskRoles,
      updatedParameters,
      updatedSecrets,
      updatedExtras,
    );
  };

  const _closeEditor = () => {
    setEditorOpen(false);
    monaco.current.editor.setTheme('vs');
  };

  const _saveEdit = () => {
    setEditorOpen(false);
    _updatedComponent(protocolYaml);

    // Change to the default theme
    monaco.current.editor.setTheme('vs');
  };

  const _onYamlTextChange = text => {
    setProtocolYaml(text);
    const valid = JobProtocol.validateFromYaml(text);
    setValidationMsg(valid);
    // error if single job has multiple task roles or instances
    if (valid === '' && isSingle) {
      const jobCheck = JobProtocol.fromYaml(text);
      if (Object.keys(jobCheck.taskRoles).length > 1) {
        setValidationMsg(
          'Error: Single job should not have multiple task roles.',
        );
      }
    }
  };

  const _submitJob = async event => {
    event.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      await populateProtocolWithDataAndTensorboard(user, protocol, jobData);
      await submitJob(protocol.toYaml());
      window.location.href = `/job-detail.html?username=${user}&jobName=${protocol.name}`;
    } catch (err) {
      alert(err);
    }
  };

  return (
    <Card>
      <Stack horizontal horizontalAlign='space-between'>
        <DefaultButton
          text='Back'
          disabled={params.has('op') && params.get('op') === 'resubmit'}
          onClick={() => {
            history.push('/');
          }}
        />
        <Stack horizontal gap='l1'>
          <FormShortSection>
            <Stack horizontal horizontalAlign='space-between'>
              <Stack horizontal gap='s1'>
                <PrimaryButton
                  onClick={_submitJob}
                  disabled={!isEmpty(errorMessages)}
                >
                  Submit
                </PrimaryButton>
                <DefaultButton onClick={_openEditor}>Edit YAML</DefaultButton>
              </Stack>
            </Stack>
          </FormShortSection>
          <Stack horizontal verticalAlign='center' gap='s1'>
            <div>Advanced</div>
            <Toggle
              styles={{ root: { margin: 0 } }}
              checked={advanceFlag}
              onChange={onToggleAdvanceFlag}
            />
          </Stack>
        </Stack>
      </Stack>
      <MonacoPanel
        isOpen={isEditorOpen}
        onDismiss={_closeEditor}
        title='Protocol YAML Editor'
        header={
          <Stack grow horizontal horizontalAlign='end'>
            <DefaultButton
              onClick={() => window.open(JOB_PROTOCOL_SCHEMA_URL)}
              styles={{
                root: [ColorClassNames.neutralDarkBackground],
                rootHovered: [ColorClassNames.blackBackground],
                rootChecked: [ColorClassNames.blackBackground],
                rootPressed: [ColorClassNames.blackBackground],
                label: [ColorClassNames.white],
              }}
              text='Protocol Schema'
            />
          </Stack>
        }
        footer={
          <Stack horizontal horizontalAlign='space-between'>
            <StackItem>
              <Text className={{ color: palette.red }}>{validationMsg}</Text>
            </StackItem>
            <StackItem>
              <PrimaryButton
                onClick={_saveEdit}
                styles={{
                  rootDisabled: [
                    ColorClassNames.neutralSecondaryBackground,
                    ColorClassNames.black,
                  ],
                }}
                text='Save'
                disabled={validationMsg}
              />
            </StackItem>
          </Stack>
        }
        monacoRef={monaco}
        monacoProps={{
          language: 'yaml',
          options: { wordWrap: 'on', readOnly: false },
          value: protocolYaml,
          onChange: debounce(_onYamlTextChange, 100),
        }}
      />
    </Card>
  );
};

SubmissionSection.propTypes = {
  jobInformation: PropTypes.instanceOf(JobBasicInfo).isRequired,
  jobTaskRoles: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  parameters: PropTypes.array.isRequired,
  secrets: PropTypes.array.isRequired,
  extras: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  advanceFlag: PropTypes.bool,
  onToggleAdvanceFlag: PropTypes.func,
  jobData: PropTypes.object,
  jobProtocol: PropTypes.object,
  setJobProtocol: PropTypes.func,
  history: PropTypes.object,
  isSingle: PropTypes.bool,
};
