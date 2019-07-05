/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
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
import {BasicSection} from './basic-section';
import PropTypes from 'prop-types';
import {MonacoTextFiled} from './monaco-text-field';
import {FormShortSection} from './form-page';
import {PAI_ENV_VAR, COMMAND_PLACEHOLDER} from '../utils/constants';
import {getTheme, DelayedRender, AnimationClassNames, FontSizes} from 'office-ui-fabric-react';
import {isEmpty} from 'lodash';

const {palette, semanticColors} = getTheme();

export const CommandSection = (props) => {
  const {onChange, value} = props;

  const _onChange = (newValue) => {
    if (onChange !== undefined) {
      onChange(newValue);
    }
  };

  const borderColor = isEmpty(value)
    ? semanticColors.errorText
    : palette.neutralTertiary;

  return (
    <BasicSection sectionLabel='Command'>
      <FormShortSection>
        <MonacoTextFiled
          monacoProps={{height: 250, language: 'shell'}}
          value={value}
          placeholder={COMMAND_PLACEHOLDER}
          onChange={_onChange}
          completionItems={[...PAI_ENV_VAR.map((x) => x.key)]}
          style={{borderColor: borderColor}}
        />
        {isEmpty(value) && (
          <div role='alert'>
            <DelayedRender delay={200}>
              <p
                className={AnimationClassNames.slideDownIn20}
                style={{
                  fontSize: FontSizes.small,
                  color: semanticColors.errorText,
                  margin: 0,
                  paddingTop: 5,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span data-automation-id='error-message'>
                  {'Commands can not be empty'}
                </span>
              </p>
            </DelayedRender>
          </div>
        )}
      </FormShortSection>
    </BasicSection>
  );
};

CommandSection.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
};
