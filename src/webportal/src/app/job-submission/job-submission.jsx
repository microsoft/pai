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

import {isEmpty} from 'lodash';
import React, {useState, useCallback} from 'react';
import ReactDOM from 'react-dom';
import {Fabric, Stack, initializeIcons, StackItem, ScrollablePane, Sticky, StickyPositionType} from 'office-ui-fabric-react';
import {JobTaskRole} from './models/job-task-role';
import {JobInformation} from './components/job-information';
import {getFormClassNames} from './components/form-style';
import {initTheme} from '../components/theme';
import {JobBasicInfo} from './models/job-basic-info';
import {SubmissionSection} from './components/submission-section';
import {TaskRoles} from './components/task-roles';
// sidebar
import {Parameters} from './components/sidebar/parameters';
import {Secrets} from './components/sidebar/secrets';
import {EnvVar} from './components/sidebar/env-var';
import {DataComponent} from './components/data/data-component';

initTheme();
initializeIcons();

const formLayout = getFormClassNames().formLayout;

const SIDEBAR_PARAM = 'param';
const SIDEBAR_SECRET = 'secret';
const SIDEBAR_ENVVAR = 'envvar';
const SIDEBAR_DATA = 'data';

const JobSubmission = () => {
  const [jobTaskRoles, setJobTaskRolesState] = useState([new JobTaskRole({})]);
  const [parameters, setParameters] = useState([{key: '', value: ''}]);
  const [secrets, setSecrets] = useState([{key: '', value: ''}]);
  const [jobInformation, setJobInformation] = useState(new JobBasicInfo({}));
  const [selected, setSelected] = useState(SIDEBAR_PARAM);

  const setJobTaskRoles = useCallback((taskRoles) => {
    if (isEmpty(taskRoles)) {
      setJobTaskRolesState([new JobTaskRole({})]);
    } else {
      setJobTaskRolesState(taskRoles);
    }
  }, [setJobTaskRolesState]);

  const onSelect = useCallback((x) => {
    if (x === selected) {
      setSelected(null);
    } else {
      setSelected(x);
    }
  }, [selected, setSelected]);

  return (
    <Fabric style={{height: '100%'}}>
      <Stack className={formLayout} styles={{root: {height: '100%'}}} horizontal gap='l1'>
        {/* left column */}
        <StackItem grow shrink styles={{root: {position: 'relative'}}}>
          <ScrollablePane
            styles={{stickyBelow: {boxShadow: 'rgba(0, 0, 0, 0.06) 0px -2px 4px, rgba(0, 0, 0, 0.05) 0px -0.5px 1px'}}}
          >
            <Stack gap='l2'>
              <JobInformation
                jobInformation={jobInformation}
                onChange={setJobInformation}
              />
              <TaskRoles
                taskRoles={jobTaskRoles}
                onChange={setJobTaskRoles}
              />
              <Sticky stickyPosition={StickyPositionType.Footer}>
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
              </Sticky>
            </Stack>
          </ScrollablePane>
        </StackItem>
        {/* right column */}
        <StackItem disableShrink styles={{root: {width: 500}}}>
          <Stack gap='l2' styles={{root: {height: '100%'}}}>
            <Parameters
              parameters={parameters}
              onChange={setParameters}
              selected={selected === SIDEBAR_PARAM}
              onSelect={() => onSelect(SIDEBAR_PARAM)}
            />
            <Secrets
              secrets={secrets}
              onChange={setSecrets}
              selected={selected === SIDEBAR_SECRET}
              onSelect={() => onSelect(SIDEBAR_SECRET)}
            />
            <EnvVar
              selected={selected === SIDEBAR_ENVVAR}
              onSelect={() => onSelect(SIDEBAR_ENVVAR)}
            />
            <DataComponent
              selected={selected === SIDEBAR_DATA}
              onSelect={() => onSelect(SIDEBAR_DATA)}
              jobName={jobInformation.name}
            />
          </Stack>
        </StackItem>
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
