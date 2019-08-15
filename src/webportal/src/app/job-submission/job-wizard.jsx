/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
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

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  Fabric,
  Stack,
  initializeIcons,
  StackItem,
  IconButton,
  DefaultButton,
  IPersonaSharedProps,
  Persona, 
  PersonaSize, 
  PersonaPresence,
  getTheme,
} from 'office-ui-fabric-react';
import { isEmpty, get } from 'lodash';
import c from 'classnames';

import {JobSubmission} from './job-submission-general';
import Card from '../components/card';
import t from '../components/tachyons.scss';

const {spacing} = getTheme();

const JobWizard = () => {
  const [jobType, setJobType] = useState();

  return (
    <Fabric style={{height: '100%'}}>
      <Card style={{height: '90%', margin: `${spacing.l2}`}}>
        <Stack horizontal horizontalAlign='center' gap='100' style={{width: '100%', marginTop: 100}}>
          <IconButton iconProps={{iconName: 'Upload'}} styles={{root: {borderRadius: '100%', borderWidth: 3,width: 300, height: 300}}}/>
          <div className={c(t.br100, t.ba)} style={{width: 300, height: 300}}>
            Import
          </div>
          <div className={c(t.br100, t.ba)} style={{width: 300, height: 300}}>
            Import
          </div>
        </Stack>
      </Card>
    </Fabric>
  );
};

const contentWrapper = document.getElementById('content-wrapper');

document.getElementById('sidebar-menu--job-submission').classList.add('active');
ReactDOM.render(<JobWizard />, contentWrapper);

function layout() {
  setTimeout(function() {
    contentWrapper.style.height = contentWrapper.style.minHeight;
  }, 10);
}

window.addEventListener('resize', layout);
window.addEventListener('load', layout);
