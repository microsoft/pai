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

import React, {useCallback, useReducer, useEffect} from 'react';
import {Text} from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import {FormTextField} from './form-text-field';
import {FormPage} from './form-page';
import {FormSpinButton} from './form-spin-button';
import {VirtualCluster} from './virtual-cluster';
import Card from '../../components/card';
import {JobBasicInfo} from '../models/job-basic-info';

import {isEqual} from 'lodash';

function reducer(state, action) {
  let jobInfo;
  switch (action.type) {
    case 'name':
      jobInfo = new JobBasicInfo({...state, name: action.value});
      action.onChange(jobInfo);
      return jobInfo;
    case 'virtualCluster':
      jobInfo = new JobBasicInfo({...state, virtualCluster: action.value});
      action.onChange(jobInfo);
      return jobInfo;
    case 'initJobInfo':
      return new JobBasicInfo(action.value);
    default:
      throw new Error('Unrecognized type');
  }
}

export const JobInformation = React.memo(({jobInformation, onChange, advanceFlag}) => {
  const [jobInfo, dispatch] = useReducer(reducer, jobInformation);
  const {name, virtualCluster, jobRetryCount} = jobInfo;

  useEffect(() => {
    if (isEqual(jobInfo, jobInformation)) {
      return;
    }
    dispatch({type: 'initJobInfo', value: jobInformation});
  }, [jobInformation]);

  const _onChange = useCallback((updatedValue) => {
    if (onChange !== undefined) {
      onChange(updatedValue);
    }
  }, [onChange]);

  const _onNameChange = useCallback((name) => {
    dispatch({type: 'name', value: name, onChange: _onChange});
  }, [_onChange]);

  const _onVirtualClusterChange = useCallback((virtualCluster) => {
    dispatch({type: 'virtualCluster', value: virtualCluster, onChange: _onChange});
  }, [_onChange]);

  return (
    <Card>
      <FormPage>
        <Text variant='xxLarge' styles={{root: {fontWeight: 'semibold'}}}>
          Job Information
        </Text>
        <FormTextField
          sectionLabel={'Job name'}
          value={name}
          shortStyle
          onBlur={_onNameChange}
          placeholder='Enter job name'
        />
        <VirtualCluster
          onChange={_onVirtualClusterChange}
          virtualCluster={virtualCluster}
        />
        {advanceFlag && (
          <FormSpinButton
            sectionOptional
            sectionLabel={'Retry count'}
            shortStyle
            value={jobRetryCount}
            onChange={(value) => _onChange('jobRetryCount', value)}
          />
        )}
      </FormPage>
    </Card>
  );
});

JobInformation.propTypes = {
  jobInformation: PropTypes.instanceOf(JobBasicInfo).isRequired,
  onChange: PropTypes.func,
  advanceFlag: PropTypes.bool,
};
