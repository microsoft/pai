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

import React, {useState} from 'react';
import {getParameterStyle} from './formStyle';
import {Text, DetailsList, CheckboxVisibility, Stack, ActionButton} from 'office-ui-fabric-react';
import {KeyValueList} from './KeyValueList';

const parameterStyle = getParameterStyle();

const columns = [{key: 'column1', name: 'Key', fieldName: 'itemKey'},
                 {key: 'column2', name: 'Value', fieldName: 'itemValue'}];

export const Parameter= () => {
  const [isParameterOn, setParameterOn] = useState(false);
  const [iconName, setIconName] = useState('ChevronDown');
  const onClick = () => {
    if (!isParameterOn) {
      setIconName('ChevronUp');
    } else {
      setIconName('ChevronDown');
    }
    setParameterOn(!isParameterOn);
  };

  return (
    <Stack gap='m'>
      <Stack horizontal>
        <Text variant='large'>Parameter</Text>
        <ActionButton iconProps={{iconName: iconName}} styles={parameterStyle} onClick={onClick}/>
      </Stack>
      {
        !isParameterOn && <Text>{'you could use these predefined parameters as command variables with prefix \'$\''}</Text>
      }
      {
        isParameterOn &&
        <React.Fragment>
          <KeyValueList items={[]}/>
          <Text variant='large'>Environment</Text>
          <DetailsList items={[]} columns={columns} checkboxVisibility={CheckboxVisibility.hidden} compact/>
        </React.Fragment>
      }
    </Stack>
  );
};
