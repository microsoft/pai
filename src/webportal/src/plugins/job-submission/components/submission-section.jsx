import React, {useState} from 'react';
import {Stack, DefaultButton, PrimaryButton} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {JobProtocol} from '../models/jobProtocol';
import MonacoPanel from '../../../app/components/monaco-panel';
import {JobBasicInfo} from '../models/jobBasicInfo';
import {JobTaskRole} from '../models/jobTaskRole';
import {JobParameter} from '../models/jobParameter';
import {isNil} from 'lodash';

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
  const {jobInformation, jobTaskRoles, parameters, onChange} = props;
  const [isEditorOpen, setEditorOpen] = useState(false);

  const [jobProtocol, setjobProtocol] =
    useState(JobProtocol.fromJobComponents(jobInformation, jobTaskRoles, parameters));
  const [protocolYaml, setProtocolYaml] = useState(jobProtocol.toYaml());

  const _openEditor = (event) => {
    event.preventDefault();
    const protocol = JobProtocol.fromJobComponents(jobInformation, jobTaskRoles, parameters);
    setEditorOpen(true);
    setProtocolYaml(protocol.toYaml());
  };

  const _closeEditor = () => {
    const updatedJob = JobProtocol.fromYaml(protocolYaml);
    setEditorOpen(false);

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

  const _exportYaml = (event) => {
    event.preventDefault();
    _exportFile(jobProtocol.toYaml(), (jobInformation.name || 'job') + '.yaml', 'application/x-yaml');
  };

  const _onYamlTextChange = (text) => {
    setProtocolYaml(text);
  };

  return (
    <Stack horizontal gap='s1' horizontalAlign='center'>
      <PrimaryButton>Submit</PrimaryButton>
      <DefaultButton onClick={_openEditor}>Edit YAML</DefaultButton>
      <DefaultButton onClick={_exportYaml}>Export</DefaultButton>
      <MonacoPanel isOpen={isEditorOpen}
                   onDismiss={_closeEditor}
                   title='Protocol YAML Editor'
                   monacoProps={{language: 'yaml',
                                 options: {wordWrap: 'on', readOnly: false},
                                 value: protocolYaml,
                                 onChange: _onYamlTextChange}}
      />
    </Stack>);
};

SubmissionSection.propTypes = {
  jobInformation: PropTypes.instanceOf(JobBasicInfo).isRequired,
  jobTaskRoles: PropTypes.arrayOf(PropTypes.instanceOf(JobTaskRole)).isRequired,
  parameters: PropTypes.arrayOf(PropTypes.instanceOf(JobParameter)).isRequired,
  onChange: PropTypes.func,
};
