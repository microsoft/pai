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

import { isNaN } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { BasicSection } from '../basic-section';
import { FormShortSection } from '../form-page';
import { KeyValueList } from '../controls/key-value-list';

const PORT_LABEL_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const PortsList = React.memo(({ onChange, ports }) => (
  <BasicSection sectionLabel='Ports' sectionOptional>
    <FormShortSection>
      <KeyValueList
        name='Port List'
        value={ports}
        onChange={onChange}
        columnWidth={220}
        keyName='Port Label'
        keyField='key'
        valueName='Port Field'
        valueField='value'
        onValidateKey={val => {
          if (!PORT_LABEL_REGEX.test(val)) {
            return 'Should be string in ^[a-zA-Z_][a-zA-Z0-9_]*$ format';
          }
        }}
        onValidateValue={val => {
          let int = val;
          if (typeof val === 'string') {
            int = parseInt(val, 10);
          }
          if (int <= 0 || isNaN(int)) {
            return 'Should be integer and no less than 1';
          }
        }}
      />
    </FormShortSection>
  </BasicSection>
));

PortsList.propTypes = {
  ports: PropTypes.array,
  onChange: PropTypes.func,
};
