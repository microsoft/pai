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
import {FormTextField} from './FormTextField';
import {FormPage} from './FormPage';
import {Text} from 'office-ui-fabric-react';
import {FormSpinButton} from './FormSpinButton';
import PropTypes from 'prop-types';
import {JobBasicInfo} from '../models/jobBasicInfo';
import {VirtualCluster} from './VirtualCluster';

export const JobInformation= (props) => {
  const {defaultValue, onChange} = props;
  const [jobBasicInfo, setJobBasicInfo] = useState(defaultValue);

  const _onChange = (keyName, newValue) => {
    const updatedJobBasicInfo = new JobBasicInfo(jobBasicInfo);
    updatedJobBasicInfo[keyName] = newValue;
    if (onChange !== undefined) {
      onChange(updatedJobBasicInfo);
    }
    setJobBasicInfo(updatedJobBasicInfo);
  };

  return (
    <FormPage>
      <Text variant='xxLarge' styles={{root: {fontWeight: 'semibold'}}}>Job Information</Text>
      <FormTextField sectionLabel={'Job name'}
                     defaultValue={jobBasicInfo.name}
                     shortStyle
                     onBlur={(value) => _onChange('name', value)}
                     placeholder='Enter job name'/>
      <VirtualCluster/>
      <FormSpinButton sectionOptional
                      sectionLabel={'Retry count'}
                      shortStyle
                      value={jobBasicInfo.jobRetryCount}
                      onChange={(value) => _onChange('jobRetryCount', value)}/>
    </FormPage>
  );
};

JobInformation.propTypes = {
  defaultValue: PropTypes.instanceOf(JobBasicInfo).isRequired,
  onChange: PropTypes.func,
};
