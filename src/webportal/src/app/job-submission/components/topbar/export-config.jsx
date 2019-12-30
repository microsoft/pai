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
import { DefaultButton, ColorClassNames } from 'office-ui-fabric-react';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';

import { populateProtocolWithDataAndTensorboard } from '../../utils/utils';

const user = cookies.get('user');

export const ExportConfig = React.memo(({ jobData, jobProtocol }) => {
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
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  };

  const _exportYaml = async event => {
    event.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      await populateProtocolWithDataAndTensorboard(user, protocol, jobData);
      _exportFile(
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
      onClick={_exportYaml}
    >
      Export
    </DefaultButton>
  );
});

ExportConfig.propTypes = {
  jobData: PropTypes.object,
  jobProtocol: PropTypes.object,
};
