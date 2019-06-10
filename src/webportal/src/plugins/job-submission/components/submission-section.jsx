import React, {useState} from 'react';
import {Stack, DefaultButton, PrimaryButton} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {Job} from '../models/job';
import MonacoPanel from '../../../app/components/monaco-panel';

const exportFile = (data, filename, type) => {
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
  const {job} = props;
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [protocolSpec, setProtocolSpec] = useState(job.convertToProtocolFormat());
  const [protocolYaml, setProtocolYaml] = useState(job.generateYaml());

  const openEditor = (event) => {
    event.preventDefault();
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
  };

  const exportYaml = (event) => {
    event.preventDefault();
    exportFile(job.generateYaml(), (job.jobBasicInfo.name || 'job') + '.yaml', 'application/x-yaml');
  };

  const onYamlTextChange = (text) => {
    setProtocolYaml(text);
  };

  return (
    <Stack horizontal gap='s1' horizontalAlign='center'>
      <PrimaryButton>Submit</PrimaryButton>
      <DefaultButton onClick={openEditor}>Edit YAML</DefaultButton>
      <DefaultButton onClick={exportYaml}>Export</DefaultButton>
      <MonacoPanel isOpen={isEditorOpen}
                   onDismiss={closeEditor}
                   title='Protocol YAML Editor'
                   monacoProps={{language: 'yaml',
                                 options: {wordWrap: 'on', readOnly: false},
                                 value: protocolYaml,
                                 onChange: onYamlTextChange}}
      />
    </Stack>);
};

SubmissionSection.propTypes = {
  job: PropTypes.instanceOf(Job),
};
