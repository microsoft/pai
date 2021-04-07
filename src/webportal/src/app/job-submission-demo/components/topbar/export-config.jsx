// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';
import { ColorClassNames, DefaultButton } from 'office-ui-fabric-react';

const PureExportConfig = ({ jobProtocol }) => {
  const exportFile = (data, filename, type) => {
    const file = new Blob([data], { type });
    if (window.navigator.msSaveOrOpenBlob) {
      // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
      // Others
      const a = document.createElement('a');
      const url = URL.createObjectURL(file);
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

  const exportYaml = async e => {
    e.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      // await populateProtocolWithData(user, protocol, jobData);
      exportFile(
        protocol.toYaml(),
        (protocol.name || 'job') + '.yaml',
        'text/yaml',
      );
    } catch (err) {
      alert(err);
    }
  };

  return (
    <DefaultButton
      styles={{
        root: [ColorClassNames.neutralTertiaryAltBackground],
        rootHovered: [ColorClassNames.neutralTertiaryBackground],
      }}
      onClick={exportYaml}
    >
      Export
    </DefaultButton>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = {};

export const ExportConfig = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureExportConfig);

PureExportConfig.propTypes = {
  jobProtocol: PropTypes.object,
};
