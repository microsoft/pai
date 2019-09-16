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
import { FormTextField } from './form-text-field';
import { DockerSection } from './docker-section';
import { FormPage } from './form-page';
import { JobTaskRole } from '../models/job-task-role';
import { FormSpinButton } from './form-spin-button';
import { ContainerSizeSection } from './container-size-section';
import { CommandSection } from './command-section';
import { CompletionPolicy } from './task-role/completion-policy';
import { PortsList } from './task-role/ports-list';
import { getDefaultContainerSize } from '../models/container-size';
import { PROTOCOL_TOOLTIPS } from '../utils/constants';

export const TabFormContent = ({
  jobTaskRole,
  onContentChange,
  advanceFlag,
  isSingle,
}) => {
  const _onValueChange = (propertyName, propertyValue) => {
    const updatedJobTaskRole = new JobTaskRole(jobTaskRole);
    updatedJobTaskRole[propertyName] = propertyValue;
    if (onContentChange !== undefined) {
      onContentChange(updatedJobTaskRole);
    }
  };

  const _onValuesChange = updateProperties => {
    let updatedJobTaskRole = { ...jobTaskRole, ...updateProperties };
    updatedJobTaskRole = new JobTaskRole(updatedJobTaskRole);
    if (onContentChange !== undefined) {
      onContentChange(updatedJobTaskRole);
    }
  };

  return (
    <FormPage>
      {!isSingle && (
        <FormTextField
          sectionLabel={'Task role name'}
          sectionTooltip={PROTOCOL_TOOLTIPS.taskRoleName}
          shortStyle
          value={jobTaskRole.name}
          onChange={value => _onValueChange('name', value)}
          placeholder='Enter task role name...'
        />
      )}
      <CommandSection
        value={jobTaskRole.commands}
        onChange={value => _onValueChange('commands', value)}
      />
      {!isSingle && (
        <FormSpinButton
          sectionLabel={'Instances'}
          shortStyle
          textFiledProps={{ placeholder: 'Enter instance number...' }}
          value={jobTaskRole.instances}
          min={1}
          onChange={value => _onValueChange('instances', value)}
        />
      )}
      <ContainerSizeSection
        value={jobTaskRole.containerSize}
        onEnable={checked =>
          _onValuesChange({
            isContainerSizeEnabled: checked,
            containerSize: getDefaultContainerSize(
              jobTaskRole.containerSize.gpu,
            ),
          })
        }
        onChange={containerSize =>
          _onValueChange('containerSize', containerSize)
        }
        isContainerSizeEnabled={jobTaskRole.isContainerSizeEnabled}
      />
      <DockerSection
        sectionTooltip={PROTOCOL_TOOLTIPS.dockerImage}
        value={jobTaskRole.dockerInfo}
        onValueChange={dockerInfo => _onValueChange('dockerInfo', dockerInfo)}
      />
      {advanceFlag && (
        <React.Fragment>
          <PortsList
            ports={jobTaskRole.ports}
            onChange={ports => _onValueChange('ports', ports)}
          />
          <FormSpinButton
            sectionLabel={'Task retry count'}
            shortStyle
            sectionOptional
            value={jobTaskRole.taskRetryCount || 0}
            onChange={value => _onValueChange('taskRetryCount', value)}
          />
          <CompletionPolicy
            onChange={completion => _onValueChange('completion', completion)}
            value={jobTaskRole.completion}
          />
        </React.Fragment>
      )}
    </FormPage>
  );
};

TabFormContent.propTypes = {
  jobTaskRole: PropTypes.instanceOf(JobTaskRole).isRequired,
  onContentChange: PropTypes.func,
  advanceFlag: PropTypes.bool,
  isSingle: PropTypes.bool,
};
