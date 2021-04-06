// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { connect } from 'react-redux';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import { ColorClassNames, FontWeights, Label } from 'office-ui-fabric-react';
import { Button } from '../../elements';
import { JobProtocol } from '../../models/job-protocol';

const PureImportConfig = ({ onJobProtocolChange }) => {
  const importFile = e => {
    e.preventDefault();
    const files = e.target.files;
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
        const updatedJob = JobProtocol.fromYaml(text);
        if (isNil(updatedJob)) {
          return;
        }
        onJobProtocolChange(new JobProtocol(updatedJob));
      } catch (err) {
        alert(err.message);
      }
    });
    fileReader.readAsText(files[0]);
  };

  return (
    <Button marginLeft='s1'>
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
          onChange={importFile}
        />
      </Label>
    </Button>
  );
};

const mapStateToProps = () => {};

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const ImportConfig = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureImportConfig);

PureImportConfig.propTypes = {
  onJobProtocolChange: PropTypes.func,
};
