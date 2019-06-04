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
import PropTypes from 'prop-types';
import {FormTextFiled} from './FormTextFiled';
import {DockerSection} from './DockerSection';
import {PortsList} from './PortsList';
import {FormPage} from './FormPage';
import {JobTaskRole} from '../models/jobTaskRole';
import {CompletionSection} from './CompletionSection';
import {DeploymentSection} from './DeploymentSection';
import {FormSpinButton} from './FormSpinButton';
import {ContainerSizeSection} from './ContainerSizeSection';

export const TabFormContent = (props) => {
  const {jobTaskRole, onContentChange} = props;

  const _onValueChange = (propertyName, propertyValue) => {
    let udpatedJobTaskRole = new JobTaskRole(jobTaskRole);
    udpatedJobTaskRole[propertyName] = propertyValue;
    onContentChange(udpatedJobTaskRole);
  };

  const _onValuesChange = (updateProperties) => {
    let udpatedJobTaskRole = {...jobTaskRole, ...updateProperties};
    udpatedJobTaskRole = new JobTaskRole(udpatedJobTaskRole);
    onContentChange(udpatedJobTaskRole);
  };

  const _onPortAdd = (port) => {
    const {ports} = jobTaskRole;
    ports.push(port);
    _onValueChange('ports', ports);
  };

  const _onPortDelete = (index) => {
    let {ports} = jobTaskRole;
    ports = ports.filter((_, itemIndex) => index !== itemIndex);
    _onValueChange('ports', ports);
  };

  const _onPortChange = (index, port) => {
    const {ports} = jobTaskRole;
    ports[index] = port;
    _onValueChange('ports', ports);
  };

  return (
    <FormPage>
      <FormTextFiled sectionLabel={'Task role name'}
                     value={jobTaskRole.name}
                     onChange={(value) => _onValueChange('name', value)}
                     textFiledProps={{placeholder: 'Enter task role name...'}}/>
      <DockerSection dockerInfo={jobTaskRole.dockerInfo}
                     onValueChange={(dockerInfo) => _onValueChange('dockerInfo', dockerInfo)}/>
      <FormSpinButton sectionLabel={'Instances'}
                      textFiledProps={{placeholder: 'Enter instance number...'}}
                      value={jobTaskRole.instances}
                      onChange={(value) => _onValueChange('instances', value)}/>
      <ContainerSizeSection value={jobTaskRole.containerSize}
                            onEnable={(checked) => _onValuesChange({
                              isContainerSizeEnabled: checked,
                              containerSize: jobTaskRole.containerSize.getResetContainerSize(),
                            })}
                            onChange={(containerSize) => _onValueChange('containerSize', containerSize)}
                            isContainerSizeEnabled={jobTaskRole.isContainerSizeEnabled}/>
      <PortsList ports={jobTaskRole.ports}
                 onPortAdd={_onPortAdd}
                 onPortDelete={_onPortDelete}
                 onPortChange={_onPortChange}/>
      <FormSpinButton sectionLabel={'Task retry count'}
                      sectionOptional
                      value={jobTaskRole.taskRetryCount}
                      onChange={(value)=>_onValueChange('taskRetryCount', value)}/>
      <CompletionSection onChange={(completion)=>_onValueChange('completion', completion)}
                         value={jobTaskRole.completion}/>
      <FormTextFiled sectionLabel={'Command'}
                     multiline={true}
                     rows={10}
                     value={jobTaskRole.command}
                     onChange={(value) => _onValueChange('command', value)}/>
      <DeploymentSection value={jobTaskRole.deployment}
                         onChange={(deployment) => _onValueChange('deployment', deployment)}/>
    </FormPage>
  );
};

TabFormContent.propTypes = {
  jobTaskRole: PropTypes.instanceOf(JobTaskRole).isRequired,
  onContentChange: PropTypes.func,
};
