// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import React, { useState, useEffect, useContext } from 'react';
import { PropTypes } from 'prop-types';
import {
  TextField,
  Stack,
  IconButton,
  TooltipHost,
} from 'office-ui-fabric-react';
import { getTheme } from '@uifabric/styling';

import CustomPassword from '../components/CustomPassword';

import Context from './Context';

export default function TableTextField(props) {
  const {
    onGetErrorMessage,
    styles,
    customPasswordStyle,
    ...otherProps
  } = props;
  const { readOnly, defaultValue } = props;
  const [customErrorMessage, setCustomErrorMessage] = useState();
  const { allUsers } = useContext(Context);
  const theme = getTheme();

  let showError = false;
  if (customErrorMessage && !readOnly) {
    showError = true;
  }

  let textFiedlStyle = styles;
  if (showError) {
    if (textFiedlStyle) {
      textFiedlStyle = Object.assign(textFiedlStyle, {
        fieldGroup: [
          {
            borderColor: theme.semanticColors.errorText,
          },
        ],
      });
    } else {
      textFiedlStyle = {
        fieldGroup: [
          {
            borderColor: theme.semanticColors.errorText,
          },
        ],
      };
    }
  }

  const _getErrorMessage = value => {
    if (!readOnly) {
      setCustomErrorMessage(onGetErrorMessage(value));
    }
  };

  useEffect(() => {
    _getErrorMessage(defaultValue);
  }, [defaultValue, allUsers]);

  return (
    <Stack horizontal>
      <Stack.Item grow>
        {customPasswordStyle ? (
          <CustomPassword
            styles={textFiedlStyle}
            {...otherProps}
            onGetErrorMessage={_getErrorMessage}
          />
        ) : (
          <TextField
            styles={textFiedlStyle}
            {...otherProps}
            onGetErrorMessage={_getErrorMessage}
          />
        )}
      </Stack.Item>
      <Stack.Item>
        {showError && (
          <TooltipHost content={customErrorMessage}>
            <IconButton
              iconProps={{ iconName: 'Info' }}
              style={{ color: theme.semanticColors.errorText }}
            />
          </TooltipHost>
        )}
        {!showError && <div style={{ width: 32 }} />}
      </Stack.Item>
    </Stack>
  );
}

TableTextField.propTypes = {
  onGetErrorMessage: PropTypes.func,
  styles: PropTypes.object,
  defaultValue: PropTypes.string,
  readOnly: PropTypes.bool,
  customPasswordStyle: PropTypes.bool,
};
