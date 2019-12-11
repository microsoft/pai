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

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route } from 'react-router-dom';
import { initializeIcons, Fabric } from 'office-ui-fabric-react';

import { initTheme } from '../components/theme';
import { JobSubmissionPage } from './job-submission-page';
import JobWizard from './job-wizard';

initTheme();
initializeIcons();

const App = () => {
  const [yamlText, setYamlText] = useState();
  return (
    <Fabric style={{ height: '100%' }}>
      <Router>
        <Route
          path='/'
          exact
          render={({ history }) => (
            <JobWizard setYamlText={setYamlText} history={history} />
          )}
        />
        <Route
          path='/single'
          render={({ history }) => (
            <JobSubmissionPage
              isSingle={true}
              history={history}
              setYamlText={setYamlText}
            />
          )}
        />
        <Route
          path='/general'
          render={({ history }) => (
            <JobSubmissionPage
              isSingle={false}
              yamlText={yamlText}
              history={history}
            />
          )}
        />
      </Router>
    </Fabric>
  );
};

const contentWrapper = document.getElementById('content-wrapper');

document.getElementById('sidebar-menu--job-submission').classList.add('active');
ReactDOM.render(<App />, contentWrapper);

function layout() {
  setTimeout(function() {
    contentWrapper.style.height = contentWrapper.style.minHeight;
  }, 10);
}

window.addEventListener('resize', layout);
window.addEventListener('load', layout);
