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
import {getParameterStyle} from './form-style';
import {Text, DetailsList, CheckboxVisibility, Stack, ActionButton} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {KeyValueList} from './key-value-list';
import {JobParameter} from '../models/job-parameter';

const parameterStyle = getParameterStyle();

const columns = [{key: 'column1', name: 'Key', fieldName: 'itemKey'},
                 {key: 'column2', name: 'Value', fieldName: 'itemValue'}];

export const Parameters= (props) => {
  const {parameters, environment, onChange} = props;
  const [isParameterOn, setParameterOn] = useState(false);
  const [iconName, setIconName] = useState('ChevronDown');
  const _onClick = () => {
    if (!isParameterOn) {
      setIconName('ChevronUp');
    } else {
      setIconName('ChevronDown');
    }
    setParameterOn(!isParameterOn);
  };

  const _onParametersChange = (updatedParameters) => {
    if (onChange !== undefined) {
      onChange(updatedParameters);
    }
  };

  const _onParameterAdd = (item) => {
    const newParameter = new JobParameter({key: item.itemKey, value: item.itemValue});
    const updatedParameters = [...parameters, newParameter];
    _onParametersChange(updatedParameters);
  };

  const _onParameterDelete = (index) => {
    const updatedParameters = parameters.filter((_, itemIndex) => index !== itemIndex);
    _onParametersChange(updatedParameters);
  };

  return (
    <Stack gap='m'>
      <Stack horizontal horizontalAlign='space-between'>
        <Text styles={parameterStyle.headerText}>Parameter</Text>
        <ActionButton iconProps={{iconName: iconName}} styles={parameterStyle.actionButton} onClick={_onClick}/>
      </Stack>
      {
        isParameterOn &&
        <React.Fragment>
          <Text>{'you could use these predefined parameters as command variables with prefix \'$\''}</Text>
          <KeyValueList items={parameters.map((parameter) => {
                          return {itemKey: parameter.key, itemValue: parameter.value};
                        })}
                        onItemAdd={_onParameterAdd}
                        onItemDelete={_onParameterDelete}/>
          <Text styles={parameterStyle.headerText}>Environment</Text>
          <DetailsList items={environment} columns={columns} checkboxVisibility={CheckboxVisibility.hidden} compact/>
        </React.Fragment>
      }
    </Stack>
  );
};

Parameters.propTypes = {
  parameters: PropTypes.arrayOf(PropTypes.instanceOf(JobParameter)).isRequired,
  environment: PropTypes.array.isRequired,
  onChange: PropTypes.func,
};

