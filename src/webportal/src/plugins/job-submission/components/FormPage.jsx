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
import {Stack} from 'office-ui-fabric-react';
import {getFormPageSytle} from './formStyle';
import PropTypes from 'prop-types';

const {formPageStyle} = getFormPageSytle();

export const FormPage = (props) => {
  return (
    <Stack styles={formPageStyle} gap={'20px'}>
      {props.children}
    </Stack>
  );
};

export const FormSection = (props) => {
  return (
    <Stack horizontal gap={'16px'}>
      {props.children}
    </Stack>
  );
};

export const FormColumn = (props) => {
  return (
    <Stack styles={props.styles} gap={'16px'}>
      {props.children}
  </Stack>
  );
};

FormPage.propTypes = {
  children: PropTypes.node,
};

FormSection.propTypes = {
  children: PropTypes.node,
};

FormColumn.propTypes = {
  children: PropTypes.node,
  styles: PropTypes.object,
};
