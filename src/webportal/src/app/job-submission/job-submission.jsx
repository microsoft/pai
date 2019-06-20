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

import React, {useState, useEffect, useCallback} from 'react';
import ReactDOM from 'react-dom';
import {Fabric, Stack, initializeIcons, StackItem} from 'office-ui-fabric-react';
import {JobTaskRole} from './models/job-task-role';
import {JobInformation} from './components/job-information';
import {Parameters} from './components/right/parameters';
import {DataComponent} from './components/data/data-component';
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
  const [jobTaskRoles, setJobTaskRolesState] = useState([new JobTaskRole({})]);
  const [parameters, setParameters] = useState([]);
  const [jobInformation, setJobInformation] = useState(new JobBasicInfo({}));

  const setJobTaskRoles = useCallback((taskRoles) => {
    if (isEmpty(taskRoles)) {
      setJobTaskRolesState([new JobTaskRole({})]);
    } else {
      setJobTaskRolesState(taskRoles);
    }
  });

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
          <StackItem grow>
            <Stack gap='l2'>
              <StackItem className={topForm}>
                <JobInformation
                  jobInformation={jobInformation}
                  onChange={setJobInformation}
                />
              </StackItem>
              <StackItem>
                {/* pivot */}
                <TaskRoles
                  taskRoles={jobTaskRoles}
                  onChange={setJobTaskRoles}
                />
              </StackItem>
              <StackItem>
                <SubmissionSection
                  jobInformation={jobInformation}
                  jobTaskRoles={jobTaskRoles}
                  parameters={parameters}
                  onChange={(updatedJobInfo, updatedTaskRoles, updatedParameters) => {
                    setJobInformation(updatedJobInfo);
                    setJobTaskRoles(updatedTaskRoles);
                    setParameters(updatedParameters);
                  }}
                />
              </StackItem>
            </Stack>
          </StackItem>
          {/* right column */}
          <StackItem disableShrink styles={{root: [t.w30]}}>
            <Stack gap='l2'>
              <Parameters
                className={topForm}
                parameters={parameters}
                onChange={setParameters}
              />
            </Stack>
            <Stack gap='l2' padding='l1 0 0 0'>
              <DataComponent jobInformation={jobInformation}/>
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

function layout() {
  setTimeout(function() {
    contentWrapper.style.height = contentWrapper.style.minHeight;
  }, 10);
}

window.addEventListener('resize', layout);
window.addEventListener('load', layout);
