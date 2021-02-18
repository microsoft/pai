// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License

import React from 'react';
import { DefaultButton, ColorClassNames } from 'office-ui-fabric-react';
import yaml from 'js-yaml';
import PropTypes from 'prop-types';

export const YamlEditExportConfig = React.memo(({ protocolYaml }) => {
  const _exportFile = (data, filename, type) => {
    const file = new Blob([data], { type: type });
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
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  };

  const _exportYaml = async (event) => {
    event.preventDefault();
    try {
      _exportFile(
        protocolYaml,
        (yaml.safeLoad(protocolYaml).name || 'job') + '.yaml',
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
      onClick={_exportYaml}
    >
      Export
    </DefaultButton>
  );
});

YamlEditExportConfig.propTypes = {
  protocolYaml: PropTypes.string.isRequired,
};
