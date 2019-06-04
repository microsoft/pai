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
import {Fabric, Stack, DefaultButton, PrimaryButton} from 'office-ui-fabric-react';
import {TabForm} from './TabForm';
import {initializeIcons} from '@uifabric/icons';
import {TabFormContent} from './TabFormContent';
import {JobTaskRole} from '../models/jobTaskRole';
import {JobInformation} from './JobInformation';
import {Parameter} from './Parameter';
import {getFormClassNames} from './formStyle';
import {initTheme} from '../../../app/components/theme';

initTheme();
initializeIcons();

export class App extends React.Component {
  constructor(props) {
    super(props);

    const items = [{headerText: 'Task role 1', content: new JobTaskRole({})}];
    this.state = {
      items: items,
    };
  }

  _onRenderTabContent(keyName, content, defaultOnContentChange) {
    return (
      <TabFormContent key={keyName} defaultValue={content} onContentChange={defaultOnContentChange}/>
    );
  }

  render() {
    const {items} = this.state;
    const formLayout = getFormClassNames().formLayout;
    const topForm = getFormClassNames().topForm;

    return (
      <Fabric>
        <Stack className={formLayout}>
          <Stack horizontal gap='l2'>
            <Stack styles={{root: {width: '70%'}}} gap='l2'>
              <Stack className={topForm}>
                <JobInformation />
              </Stack>
              <Stack className={topForm} gap='l1'>
                <Stack>
                  <TabForm defaultItems={items}
                           headerTextPrefix='Task Role'
                           createContentFunc={() => new JobTaskRole({})}
                           onRenderTabContent={this._onRenderTabContent.bind(this)}
                           onItemsChange={(items)=>this.setState({items: items})}/>
                </Stack>
                <Stack horizontal gap='s1' horizontalAlign='center'>
                  <PrimaryButton>Submit</PrimaryButton>
                  <DefaultButton>Edit YAML</DefaultButton>
                  <DefaultButton>Export</DefaultButton>
                </Stack>
              </Stack>
            </Stack>
            <Stack styles={{root: {width: '30%'}}}>
              <Stack className={topForm}>
                <Parameter/>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Fabric>
    );
  }
}
