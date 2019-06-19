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
import {FormTextField} from './form-text-field';
import {DockerSection} from './docker-section';
import {FormPage} from './form-page';
import {JobTaskRole} from '../models/job-task-role';
import {FormSpinButton} from './form-spin-button';
import {ContainerSizeSection} from './container-size-section';
import {CommandSection} from './command-section';

export const TabFormContent = (props) => {
  const {jobTaskRole, onContentChange} = props;

  const _onValueChange = (propertyName, propertyValue) => {
    const udpatedJobTaskRole = new JobTaskRole(jobTaskRole);
    udpatedJobTaskRole[propertyName] = propertyValue;
    if (onContentChange !== undefined) {
      onContentChange(udpatedJobTaskRole);
    }
  };

  const _onValuesChange = (updateProperties) => {
    let udpatedJobTaskRole = {...jobTaskRole, ...updateProperties};
    udpatedJobTaskRole = new JobTaskRole(udpatedJobTaskRole);
    if (onContentChange !== undefined) {
      onContentChange(udpatedJobTaskRole);
    }
  };

  return (
    <FormPage>
      <FormTextField sectionLabel={'Task role name'}
                     shortStyle
                     value={jobTaskRole.name}
                     onBlur={(value) => _onValueChange('name', value)}
                     placeholder='Enter task role name...'/>
      <DockerSection value={jobTaskRole.dockerInfo}
                     onValueChange={(dockerInfo) => _onValueChange('dockerInfo', dockerInfo)}/>
      <FormSpinButton sectionLabel={'Instances'}
                      shortStyle
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
      <CommandSection value={jobTaskRole.commands}
                      onChange={(value)=>_onValueChange('commands', value)}/>
    </FormPage>
  );
};

TabFormContent.propTypes = {
  jobTaskRole: PropTypes.instanceOf(JobTaskRole).isRequired,
  onContentChange: PropTypes.func,
};
