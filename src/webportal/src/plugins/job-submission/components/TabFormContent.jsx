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

import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {FormTextFiled} from './FormTextFiled';
import {DockerSection} from './DockerSection';
import {PortsList} from './PortsList';
import {FormPage} from './FormPage';
import {JobTaskRole} from '../models/jobTaskRole';
import {Completion} from './Completion';
import {Deployment} from './Deployment';
import {FormSpinButton} from './FormSpinButton';

const updateTaskRoleProperty = (jobTaskRoleState, setJobTaskRoleState, propertyName, propertyValue) => {
  let udpatedJobTaskRole = new JobTaskRole(jobTaskRoleState.name,
                                           jobTaskRoleState.instances,
                                           jobTaskRoleState.taskRetryCount,
                                           jobTaskRoleState.dockerInfo,
                                           jobTaskRoleState.ports);
  udpatedJobTaskRole[propertyName] = propertyValue;
  setJobTaskRoleState(udpatedJobTaskRole);
};

export const TabFormContent = (props) => {
  const {jobTaskRole, onContentChange} = props;
  // Use for udpate, can not be used for component input
  const [jobTaskRoleState, setJobTaskRoleState] = useState(jobTaskRole);
  const onValueChange = updateTaskRoleProperty.bind(null, jobTaskRole, setJobTaskRoleState);
  useEffect(()=>onContentChange(jobTaskRoleState), [jobTaskRoleState]);

  const onPortAdd = (port) => {
    const {ports} = jobTaskRole;
    ports.push(port);
    onValueChange('ports', ports);
  };
  const onPortDelete = (index) => {
    let {ports} = jobTaskRole;
    ports = ports.filter((_, itemIndex) => index !== itemIndex);
    onValueChange('ports', ports);
  };
  const onPortChange = (index, port) => {
    const {ports} = jobTaskRole;
    ports[index] = port;
    onValueChange('ports', ports);
  };

  return (
    <FormPage>
      <FormTextFiled label={'Task role name'}
                     required
                     value={jobTaskRole.name}
                     onChange={(value)=>onValueChange('name', value)}
                     textFiledProps={{placeholder: 'Enter task role name...'}}/>
      <DockerSection dockerInfo={jobTaskRole.dockerInfo}
                     onValueChange={(dockerInfo)=>onValueChange('dockerInfo', dockerInfo)}>
      </DockerSection>
      <FormSpinButton label={'Instance'} textFiledProps={{placeholder: 'Enter instance number...'}}/>
      <PortsList ports={jobTaskRole.ports} onPortAdd={onPortAdd} onPortDelete={onPortDelete} onPortChange={onPortChange}></PortsList>
      <FormSpinButton label={'Task retry count'} optional/>
      <Completion/>
      <FormTextFiled label={'Command'} textFiledProps={{multiline: true, rows: 10}}/>
      <Deployment/>
    </FormPage>
  );
};

TabFormContent.propTypes = {
  jobTaskRole: PropTypes.instanceOf(JobTaskRole).isRequired,
  onContentChange: PropTypes.func,
};
