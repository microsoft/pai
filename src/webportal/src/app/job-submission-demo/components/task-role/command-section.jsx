// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { MonacoTextField } from '../controls/monaco-text-field';
import { PAI_ENV_VAR, COMMAND_PLACEHOLDER } from '../../utils/constants';

export const CommandSection = ({ value, onChange }) => {
  const [yamlText, setYamlText] = useState(value);

  useEffect(() => {
    setYamlText(value);
  }, [value]);

  const onItemChange = value => {
    setYamlText(value);
    onChange('commands', value);
  };

  return (
    <MonacoTextField
      monacoProps={{ theme: 'vs', height: 250, language: 'shell' }}
      value={yamlText}
      placeholder={COMMAND_PLACEHOLDER}
      onChange={onItemChange}
      completionItems={[...PAI_ENV_VAR.map(x => x.key)]}
      errorMessage={isEmpty(value) ? 'Commands can not be empty' : null}
    />
  );
};

CommandSection.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
