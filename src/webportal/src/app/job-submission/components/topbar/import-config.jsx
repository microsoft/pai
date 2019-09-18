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

import React, { useContext } from 'react';
import {
  FontWeights,
  DefaultButton,
  Label,
  ColorClassNames,
} from 'office-ui-fabric-react';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';

import { JobProtocol } from '../../models/job-protocol';
import Context from '../context';
import {
  getJobComponentsFromConfig,
  isValidUpdatedTensorBoardExtras,
} from '../../utils/utils';

export const ImportConfig = React.memo(
  ({ extras, onChange, isSingle, history, setYamlText }) => {
    const { vcNames } = useContext(Context);

    const _updatedComponent = protocolYaml => {
      const updatedJob = JobProtocol.fromYaml(protocolYaml);
      if (isNil(updatedJob)) {
        return;
      }

      if (onChange === undefined) {
        return;
      }

      const [
        updatedJobInformation,
        updatedTaskRoles,
        updatedParameters,
        updatedSecrets,
        updatedExtras,
      ] = getJobComponentsFromConfig(updatedJob, { vcNames });

      if (extras.tensorBoard) {
        const updatedTensorBoardExtras = updatedExtras.tensorBoard || {};
        if (
          !isValidUpdatedTensorBoardExtras(
            extras.tensorBoard,
            updatedTensorBoardExtras,
          )
        ) {
          updatedExtras.tensorBoard = extras.tensorBoard;
        }
      }

      onChange(
        updatedJobInformation,
        updatedTaskRoles,
        updatedParameters,
        updatedSecrets,
        updatedExtras,
      );
    };

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
          if (isSingle) {
            setYamlText(text);
            history.push('/general');
          } else {
            _updatedComponent(text);
          }
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
  },
);

ImportConfig.propTypes = {
  extras: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  isSingle: PropTypes.bool,
  history: PropTypes.object,
  setYamlText: PropTypes.func,
};
