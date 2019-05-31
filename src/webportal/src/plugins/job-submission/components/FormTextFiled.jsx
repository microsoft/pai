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
import {getId} from 'office-ui-fabric-react/lib/Utilities';
import {TextField} from 'office-ui-fabric-react';
import {getFromComponentsStyle} from './formStyle';
import PropTypes from 'prop-types';
import {BasicSection} from './BasicSection';

const formComponentsStyles = getFromComponentsStyle();

export const FormTextFiled = (props) => {
  const {label, onChange, value, textFiledProps, optional} = props;
  const textFieldId = getId('textField');

  return (
    <BasicSection label={label} optional={optional}>
      <TextField id={textFieldId}
                     styles={formComponentsStyles.textFiled}
                     value={value}
                     onChange={(_, value) => onChange(value)}
                     {...textFiledProps}/>
    </BasicSection>
  );
};

FormTextFiled.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  value: PropTypes.string,
  textFiledProps: PropTypes.object,
  optional: PropTypes.bool,
};
