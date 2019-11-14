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

import React from 'react';
import { FontWeights, DefaultButton, Label } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';

import { JobProtocol } from '../../job-submission/models/job-protocol';

const ImportConfig = props => {
  const { setYamlText, setYamlTextName } = props;

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
      /*
      if (valid) {
        alert(`Yaml file is invalid. ${valid}`);
        return;
      }*/
      setYamlText(text);
      setYamlTextName(files[0].name);
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
          ],
        }}
      >
        {'Import Yaml'}
        <input
          type='file'
          style={{
            width: '5px',
            height: '2px',
            opacity: '.0001',
          }}
          accept='.yml,.yaml'
          onChange={_importFile}
        />
      </Label>
    </DefaultButton>
  );
};

ImportConfig.propTypes = {
  setYamlText: PropTypes.func,
  setYamlTextName: PropTypes.func,
};

export default ImportConfig;
