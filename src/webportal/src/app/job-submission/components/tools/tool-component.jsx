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
import { Stack } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { SidebarCard } from '../sidebar/sidebar-card';
import { Hint } from '../sidebar/hint';
import { TensorBoard } from './tensorboard';
import { JobSSH } from './job-ssh';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';
import config from '../../../config/webportal.config';

export const ToolComponent = React.memo(
  ({ jobData, taskRoles, extras, onExtrasChange, selected, onSelect }) => {
    return (
      <SidebarCard
        title='Tools'
        tooltip={PROTOCOL_TOOLTIPS.tools}
        selected={selected}
        onSelect={onSelect}
      >
        <Stack gap='m'>
          <Hint>
            Tools section is used to configure the tools that are useful for
            jobs.
          </Hint>
          <div>
            <TensorBoard
              jobData={jobData}
              taskRoles={taskRoles}
              extras={extras}
              onChange={onExtrasChange}
            />
          </div>
          {config.launcherType === 'k8s' && (
            <div>
              <JobSSH extras={extras} onExtrasChange={onExtrasChange} />
            </div>
          )}
        </Stack>
      </SidebarCard>
    );
  },
);

ToolComponent.propTypes = {
  jobData: PropTypes.object.isRequired,
  taskRoles: PropTypes.array.isRequired,
  extras: PropTypes.object,
  onExtrasChange: PropTypes.func.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};
