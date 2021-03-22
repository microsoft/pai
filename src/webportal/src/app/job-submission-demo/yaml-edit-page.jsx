// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
// import yaml from 'js-yaml';
import { debounce, isEmpty } from 'lodash';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react';
import MonacoEditor from '../components/monaco-editor';
import { JobProtocol } from './models/job-protocol';
import PropTypes from 'prop-types';

const PureYamlEditPage = ({ jobProtocol, onJobProtocolChange }) => {
  const [protocolYaml, setProtocolYaml] = useState(
    'Paste or import your yaml here...',
  );
  const [validStatus, setValidStatus] = useState({
    message: 'Warning: Not init with yaml yet',
    barType: MessageBarType.warning,
  });

  useEffect(() => {
    const protocol = new JobProtocol(jobProtocol);
    setProtocolYaml(protocol.toYaml());
  }, [jobProtocol]);

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

  const _onTextChange = protocolYaml => {
    const updatedJob = JobProtocol.fromYaml(protocolYaml);
    setProtocolYaml(protocolYaml);
    onJobProtocolChange({ ...updatedJob });
  };

  return (
    <>
      <MessageBar messageBarType={validStatus.barType}>
        {validStatus.message}
      </MessageBar>
      <MonacoEditor
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
    </>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol => {
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol });
  },
});

export const YamlEditPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureYamlEditPage);

PureYamlEditPage.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
