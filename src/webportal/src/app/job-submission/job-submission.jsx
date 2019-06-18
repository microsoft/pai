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

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import {Fabric, Stack, initializeIcons, StackItem} from 'office-ui-fabric-react';
import {JobTaskRole} from './models/job-task-role';
import {JobInformation} from './components/job-information';
import {Parameters} from './components/parameters';
import {getFormClassNames} from './components/form-style';
import {initTheme} from '../components/theme';
import {JobBasicInfo} from './models/job-basic-info';
import {SubmissionSection} from './components/submission-section';
import {TaskRoles} from './components/task-roles';
import t from '../components/tachyons.scss';
import {isEmpty} from 'lodash';

initTheme();
initializeIcons();

const formLayout = getFormClassNames().formLayout;
const topForm = getFormClassNames().topForm;

const JobSubmission = () => {
  const [jobTaskRoles, setJobTaskRoles] = useState([new JobTaskRole({})]);
  const [parameters, setParameters] = useState([]);
  const [jobInformation, setJobInformation] = useState(new JobBasicInfo({}));

  const taskRolesGuard = (taskRoles)=> {
    if (isEmpty(taskRoles)) {
      return [new JobTaskRole({})];
    }
    return taskRoles;
  };

  useEffect(() => {
    if (isEmpty(cookies.get('user'))) {
      // layout.component.js will redirect user to index page.
      return;
    }
  }, []);

  return (
    <Fabric>
      <Stack className={formLayout}>
        <Stack horizontal gap='l2'>
          {/* left column */}
          <StackItem grow styles={{root: {overflow: 'auto'}}}>
            <Stack gap='l2'>
              <StackItem className={topForm}>
                <JobInformation jobInformation={jobInformation}
                                onChange={(jobInformation) => setJobInformation(jobInformation)}/>
              </StackItem>
              <StackItem>
                {/* pivot */}
                <TaskRoles
                  taskRoles={jobTaskRoles}
                  onChange={(jobTaskRoles) => setJobTaskRoles(taskRolesGuard(jobTaskRoles))}
                />
              </StackItem>
              <StackItem>
                <SubmissionSection
                  jobInformation={jobInformation}
                  jobTaskRoles={jobTaskRoles}
                  parameters={parameters}
                  onChange={(updatedJobInfo, updatedTaskRoles, updatedParameters) => {
                    setJobInformation(updatedJobInfo);
                    setJobTaskRoles(taskRolesGuard(updatedTaskRoles));
                    setParameters(updatedParameters);
                  }}
                />
              </StackItem>
            </Stack>
          </StackItem>
          {/* right column */}
          {/* todo: sticky component */}
          <StackItem disableShrink styles={{root: [t.w30]}}>
            <Stack className={topForm} styles={{root: {position: 'fixed',
                   maxHeight: '80%', overflow: 'auto', marginRight: spacing.l1,
                   width: `calc(30% - ${spacing.l2} - ${spacing.l1} - ${spacing.l1} - ${spacing.s1})`}}}>
              <Parameters parameters={parameters}
                          onChange={(parameters) => setParameters(parameters)}/>
            </Stack>
          </StackItem>
        </Stack>
      </Stack>
    </Fabric>
  );
};

const contentWrapper = document.getElementById('content-wrapper');

ReactDOM.render(<JobSubmission />, contentWrapper);

document.getElementById('sidebar-menu--job-submission').classList.add('active');
