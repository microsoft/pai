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
import {Fabric, Stack, initializeIcons} from 'office-ui-fabric-react';
import {TabFormContent} from './TabFormContent';
import {JobTaskRole} from '../models/jobTaskRole';
import {JobInformation} from './JobInformation';
import {Parameters} from './Parameters';
import {getFormClassNames} from './formStyle';
import {initTheme} from '../../../app/components/theme';
import {JobBasicInfo} from '../models/jobBasicInfo';
import {SubmissionSection} from './SubmissionSection';
import {TaskRoles} from './TaskRoles';
import {Job} from '../models/job';
import t from '../../../app/components/tachyons.scss';

initTheme();
initializeIcons();

export class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      jobTaskRoles: [new JobTaskRole({})],
      parameters: [],
      jobInformation: new JobBasicInfo({}),
    };
  }

  _onRenderTabContent(keyName, content, defaultOnContentChange) {
    return (
      <TabFormContent key={keyName} defaultValue={content} onContentChange={defaultOnContentChange}/>
    );
  }

  render() {
    const {jobTaskRoles, parameters, jobInformation} = this.state;
    const formLayout = getFormClassNames().formLayout;
    const topForm = getFormClassNames().topForm;

    return (
      <Fabric>
        <Stack className={formLayout}>
          <Stack horizontal gap='l2'>
            <Stack styles={{root: [t.w70]}} gap='l2'>
              <Stack className={topForm}>
                <JobInformation defaultValue={jobInformation}
                                onChange={(jobInformation) => this.setState({jobInformation: jobInformation})}/>
              </Stack>
              <Stack className={topForm} gap='l1'>
                <TaskRoles defaultValue={[new JobTaskRole({})]}
                           onChange={(jobTaskRoles) => this.setState({jobTaskRoles: jobTaskRoles})}/>
                <SubmissionSection job={new Job(jobInformation, jobTaskRoles, parameters)}/>
              </Stack>
            </Stack>
            <Stack styles={{root: [t.w30]}}>
              <Stack className={topForm}>
                <Parameters defaultValue={parameters}
                            environment={[]}
                            onChange={(parameters) => this.setState({parameters: parameters})}/>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Fabric>
    );
  }
}
