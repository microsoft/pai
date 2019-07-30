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
import {isNil, debounce, isEqual, isEmpty, cloneDeep} from 'lodash';
import React, {useState, useRef, useEffect, useContext} from 'react';
import MediaQuery from 'react-responsive';
import {
  Stack,
  DefaultButton,
  PrimaryButton,
  Text,
  getTheme,
  Label,
  StackItem,
  Toggle,
} from 'office-ui-fabric-react';

import {getImportButtonStyle} from './form-style';
import {JobProtocol} from '../models/job-protocol';
import {JobBasicInfo} from '../models/job-basic-info';
import {JobTaskRole} from '../models/job-task-role';
import {submitJob} from '../utils/conn';
import MonacoPanel from '../../components/monaco-panel';
import Card from '../../components/card';
import {
  populateProtocolWithDataCli,
  getJobComponentsFromConfig,
} from '../utils/utils';
import Context from './context';
import {BasicSection} from './basic-section';
import {FormShortSection} from './form-page';

const JOB_PROTOCOL_SCHEMA_URL =
  'https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml';

const user = cookies.get('user');
const {palette, spacing} = getTheme();
const importButtonStyle = getImportButtonStyle();

const _exportFile = (data, filename, type) => {
  let file = new Blob([data], {type: type});
  if (window.navigator.msSaveOrOpenBlob) {
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else {
    // Others
    let a = document.createElement('a');
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
};

const VALIDATION_ERROR_MESSAGE_ID = 'Submission Section';

export const SubmissionSection = (props) => {
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
    initJobProtocol,
  } = props;
  const [isEditorOpen, setEditorOpen] = useState(false);

  const [jobProtocol, setjobProtocol] = useState(new JobProtocol(initJobProtocol));
  const [protocolYaml, setProtocolYaml] = useState('');
  const [validationMsg, setValidationMsg] = useState('');

  const monaco = useRef(null);

  const {vcNames, errorMessages, setErrorMessage} = useContext(Context);

  const _protocolAndErrorUpdate = (protocol) => {
    if (!isEqual(jobProtocol, protocol)) {
      setjobProtocol(protocol);
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


  const _openEditor = async (event) => {
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
      await populateProtocolWithDataCli(user, protocol, jobData);
      setProtocolYaml(protocol.toYaml());
    } catch (err) {
      alert(err);
    }
  };

  const _updatedComponent = (protocolYaml) => {
    const updatedJob = JobProtocol.fromYaml(protocolYaml);
    if (isNil(updatedJob)) {
      return;
    }

    setjobProtocol(updatedJob);
    if (onChange === undefined) {
      return;
    }

    const [
      updatedJobInformation,
      updatedTaskRoles,
      updatedParameters,
      updatedSecrets,
      updatedExtras,
    ] = getJobComponentsFromConfig(updatedJob, {vcNames});

    if (extras.tensorBoard) {
      const originalTensorBoardExtras = extras.tensorBoard;
      const updatedTensorBoardExtras = updatedExtras.tensorBoard || {};
      if (updatedTensorBoardExtras.randomStr !== originalTensorBoardExtras.randomStr
        || !updatedTensorBoardExtras.logDirectories
        || Object.getOwnPropertyNames(updatedTensorBoardExtras).length !== 2) {
        updatedExtras.tensorBoard = originalTensorBoardExtras.tensorBoard;
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
    _updatedComponent(protocolYaml);

    // Change to the default theme
    monaco.current.editor.setTheme('vs');
  };

  const _exportYaml = async (event) => {
    event.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      await populateProtocolWithDataCli(user, protocol, jobData);
      _exportFile(
        protocol.toYaml(),
        (protocol.name || 'job') + '.yaml',
        'text/yaml',
      );
    } catch (err) {
      alert(err);
    }
  };

  const _importFile = (event) => {
    event.preventDefault();
    const files = event.target.files;
    if (!files || !files[0]) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      const text = String(fileReader.result);
      try {
        _updatedComponent(text);
      } catch (err) {
        alert(err.message);
      }
    });
    fileReader.readAsText(files[0]);
  };

  const _onYamlTextChange = (text) => {
    setProtocolYaml(text);
    setValidationMsg(JobProtocol.validateFromYaml(text));
  };

  const _submitJob = async (event) => {
    event.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      await populateProtocolWithDataCli(user, protocol, jobData);
      await submitJob(protocol.toYaml());
      window.location.href = `/job-detail.html?username=${user}&jobName=${
        protocol.name
        }`;
    } catch (err) {
      alert(err);
    }
  };


  const widthBreakpoint = 1550;

  return (
    <Card>
      {/* large - align with task role card (simulate the top section taskrole-sidebar layout) */}
      <MediaQuery minWidth={widthBreakpoint}>
        <Stack horizontal gap='l1'>
          <StackItem grow styles={{root: {minWidth: 600, flexBasis: 0}}}>
            <BasicSection>
              <Stack horizontal gap='l1'>
                <FormShortSection>
                  <Stack horizontal horizontalAlign='space-between'>
                    <Stack horizontal gap='s1'>
                      <PrimaryButton onClick={_submitJob} disabled={!isEmpty(errorMessages)}>
                        Submit
                      </PrimaryButton>
                      <DefaultButton
                        onClick={_openEditor}
                      >
                        Edit YAML
                      </DefaultButton>
                    </Stack>
                    <Stack horizontal gap='s1'>
                      <DefaultButton onClick={_exportYaml}>Export</DefaultButton>
                      <DefaultButton>
                        <Label styles={{root: importButtonStyle.label}}>
                          {'Import'}
                          <input
                            type='file'
                            style={importButtonStyle.input}
                            accept='.yml,.yaml'
                            onChange={_importFile}
                          />
                        </Label>
                      </DefaultButton>
                    </Stack>
                  </Stack>
                </FormShortSection>
                <Stack horizontal verticalAlign='center' gap='s1'>
                  <div>Advanced</div>
                  <Toggle
                    styles={{root: {margin: 0}}}
                    checked={advanceFlag}
                    onChange={onToggleAdvanceFlag}
                  />
                </Stack>
              </Stack>
            </BasicSection>
          </StackItem>
          <div style={{width: 550}}></div>
        </Stack>
      </MediaQuery>
      {/* small screen - center */}
      <MediaQuery maxWidth={widthBreakpoint - 1}>
        <Stack horizontal gap='s1' horizontalAlign='center'>
          <PrimaryButton onClick={_submitJob} disabled={!isEmpty(errorMessages)}>
            Submit
          </PrimaryButton>
          <DefaultButton
            onClick={_openEditor}
            styles={{root: {marginRight: spacing.l2}}}
          >
            Edit YAML
          </DefaultButton>
          <DefaultButton onClick={_exportYaml}>Export</DefaultButton>
          <DefaultButton>
            <Label styles={{root: importButtonStyle.label}}>
              {'Import'}
              <input
                type='file'
                style={importButtonStyle.input}
                accept='.yml,.yaml'
                onChange={_importFile}
              />
            </Label>
          </DefaultButton>
          <Stack horizontal padding='0 0 0 s1' verticalAlign='center' gap='s1'>
            <div>Advanced</div>
            <Toggle
              styles={{root: {margin: 0}}}
              checked={advanceFlag}
              onChange={onToggleAdvanceFlag}
            />
          </Stack>
        </Stack>
      </MediaQuery>
      <MonacoPanel
        isOpen={isEditorOpen}
        onDismiss={_closeEditor}
        title='Protocol YAML Editor'
        header={
          <Stack grow horizontal>
            <StackItem grow align='center'>
              <Text className={{color: palette.white}}>
                {String(validationMsg)}
              </Text>
            </StackItem>
            <StackItem horizontalAlign='end'>
              <DefaultButton
                onClick={() => window.open(JOB_PROTOCOL_SCHEMA_URL)}
              >
                Protocol Schema
              </DefaultButton>
            </StackItem>
          </Stack>
        }
        monacoRef={monaco}
        monacoProps={{
          language: 'yaml',
          options: {wordWrap: 'on', readOnly: false},
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
  initJobProtocol: PropTypes.object,
};
