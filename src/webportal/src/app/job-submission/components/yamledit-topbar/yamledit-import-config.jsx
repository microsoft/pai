// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License

import React from 'react';
import {
  FontWeights,
  DefaultButton,
  Label,
  ColorClassNames,
} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

import { JobProtocol } from '../../models/job-protocol';

export const YamlEditImportConfig = React.memo(({ onChange }) => {
  const _importFile = event => {
    event.preventDefault();
    const files = event.target.files;
    if (!files || !files[0]) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      const text = String(fileReader.result);
      const valid = JobProtocol.validateFromYaml(text);
      if (valid) {
        alert(`Yaml file is invalid. ${valid}`);
        return;
      }
      try {
        onChange(text);
      } catch (err) {
        alert(err.message);
      }
    });
    fileReader.readAsText(files[0]);
  };

  return (
    <DefaultButton>
      <Label
        styles={{
          root: [
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              cursor: 'pointer',
              fontWeight: FontWeights.semibold,
            },
            ColorClassNames.neutralTertiaryAltBackground,
            ColorClassNames.neutralTertiaryBackgroundHover,
          ],
        }}
      >
        {'Import'}
        <input
          type='file'
          style={{
            width: '1px',
            height: '1px',
            opacity: '.0001',
          }}
          accept='.yml,.yaml'
          onChange={_importFile}
        />
      </Label>
    </DefaultButton>
  );
});

YamlEditImportConfig.propTypes = {
  onChange: PropTypes.func,
};
