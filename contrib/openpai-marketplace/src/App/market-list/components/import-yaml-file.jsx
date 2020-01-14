/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
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

import React, { useState, useCallback } from 'react';
import { DefaultButton, Stack, Text } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

import { JobProtocol } from '../models/job-protocol';

const ImportYamlFile = props => {
  const { setYamlText } = props;
  const [yamlFileName, setYamlFileName] = useState('');
  const uploadFile = React.createRef();

  const importFile = useCallback(event => {
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
      setYamlText(text);
      setYamlFileName(files[0].name);
    });
    fileReader.readAsText(files[0]);
  });

  return (
    <div>
      <Stack horizontal verticalAlign='baseline' gap='m'>
        <DefaultButton
          text='Upload yaml file'
          onClick={() => {
            uploadFile.current.click();
          }}
        />
        <Text>{yamlFileName}</Text>
      </Stack>
      <input
        type='file'
        ref={uploadFile}
        accept='.yml,.yaml'
        style={{ display: 'none' }}
        onChange={importFile}
      />
    </div>
  );
};

ImportYamlFile.propTypes = {
  setYamlText: PropTypes.func,
};

export default ImportYamlFile;
