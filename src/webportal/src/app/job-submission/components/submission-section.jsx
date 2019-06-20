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

import React, {useState, useRef} from 'react';
import {Stack, DefaultButton, PrimaryButton, Text, getTheme, Label, StackItem, Toggle} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {isNil, debounce} from 'lodash';
import {getImportButtonStyle} from './form-style';
import {JobProtocol} from '../models/job-protocol';
import {JobBasicInfo} from '../models/job-basic-info';
import {JobTaskRole} from '../models/job-task-role';
import {JobParameter} from '../models/job-parameter';
import {submitJob} from '../utils/conn';
import MonacoPanel from '../../components/monaco-panel';
import Card from '../../components/card';

const user = cookies.get('user');
const {palette} = getTheme();
const importButtonStyle = getImportButtonStyle();

const _exportFile = (data, filename, type) => {
  let file = new Blob([data], {type: type});
  if (window.navigator.msSaveOrOpenBlob) { // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else { // Others
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

export const SubmissionSection = (props) => {
  const {jobInformation, jobTaskRoles, parameters, onChange, advanceFlag, onToggleAdvanceFlag} = props;
  const [isEditorOpen, setEditorOpen] = useState(false);

  const [jobProtocol, setjobProtocol] = useState(new JobProtocol({}));
  const [protocolYaml, setProtocolYaml] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const monaco = useRef(null);

  const _openEditor = (event) => {
    event.preventDefault();
    const protocol = jobProtocol.getUpdatedProtocol(jobInformation, jobTaskRoles, parameters);
    setEditorOpen(true);
    setProtocolYaml(protocol.toYaml());
  };

  const _udpatedComponent = (protocolYaml) => {
    const updatedJob = JobProtocol.fromYaml(protocolYaml);
    if (isNil(updatedJob)) {
      return;
    }

    setjobProtocol(updatedJob);
    if (onChange === undefined) {
      return;
    }

    const {taskRoles, deployments, prerequisites, parameters} = updatedJob;
    const updatedJobInformation = JobBasicInfo.fromProtocol(updatedJob);
    const updatedParameters = Object.keys(parameters)
                                    .map((key) => new JobParameter({key: key, value: parameters[key]}));
    const updatedTaskRoles = Object.keys(taskRoles)
                                   .map((name) => JobTaskRole.fromProtocol(name, taskRoles[name], deployments, prerequisites));
    onChange(updatedJobInformation, updatedTaskRoles, updatedParameters);
  };

  const _closeEditor = () => {
    setEditorOpen(false);
    _udpatedComponent(protocolYaml);

    // Change to the default theme
    monaco.current.editor.setTheme('vs');
  };

  const _exportYaml = (event) => {
    event.preventDefault();
    _exportFile(jobProtocol.toYaml(), (jobInformation.name || 'job') + '.yaml', 'text/yaml');
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
        _udpatedComponent(text);
      } catch (err) {
        alert(err.message);
      }
    });
    fileReader.readAsText(files[0]);
  };

  const _onYamlTextChange = (text) => {
    setProtocolYaml(text);
    setErrorMsg(JobProtocol.validateFromYaml(text));
  };

  const _submitJob = (event) => {
    event.preventDefault();
    submitJob(jobProtocol.toYaml()).then(() => {
      window.location.href = `/job-detail.html?username=${user}&jobName=${jobProtocol.name}`;
    }).catch((err) => alert(err));
  };

  return (
    <Card>
      <Stack horizontal>
        <StackItem grow>
          <Stack horizontal gap='s1' horizontalAlign='center'>
            <PrimaryButton onClick={_submitJob}>Submit</PrimaryButton>
            <DefaultButton onClick={_openEditor}>Edit YAML</DefaultButton>
          </Stack>
        </StackItem>
        <Stack gap='s1' horizontal>
          <DefaultButton onClick={_exportYaml}>Export</DefaultButton>
          <DefaultButton>
            <Label styles={{root: importButtonStyle.label}}>
              {'Import'}
              <input type='file' style={importButtonStyle.input} accept='.yml,.yaml' onChange={_importFile}/>
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
        <MonacoPanel isOpen={isEditorOpen}
                    onDismiss={_closeEditor}
                    title='Protocol YAML Editor'
                    header={<Text className={{color: palette.white}}>{String(errorMsg)}</Text>}
                    monacoRef={monaco}
                    monacoProps={{language: 'yaml',
                                  options: {wordWrap: 'on', readOnly: false},
                                  value: protocolYaml,
                                  onChange: debounce(_onYamlTextChange, 100),
                                  }}
        />
      </Stack>
    </Card>
  );
};

SubmissionSection.propTypes = {
  jobInformation: PropTypes.instanceOf(JobBasicInfo).isRequired,
  jobTaskRoles: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  parameters: PropTypes.arrayOf(PropTypes.instanceOf(JobParameter)).isRequired,
  onChange: PropTypes.func,
  advanceFlag: PropTypes.bool,
  onToggleAdvanceFlag: PropTypes.func,
};
