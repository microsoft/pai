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

import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route } from 'react-router-dom';
import {
  initializeIcons,
  Fabric,
  Stack,
  Text,
  DefaultButton,
  getTheme,
  FontSizes,
  FontWeights,
} from 'office-ui-fabric-react';

import { initTheme } from '../components/theme';
import uploadRoot from '../../assets/img/upload-root.svg';
import uploadPress from '../../assets/img/upload-press.svg';
import singleRoot from '../../assets/img/single-root.svg';
import singlePress from '../../assets/img/single-press.svg';
import distributeRoot from '../../assets/img/distribute-root.svg';
import distributePress from '../../assets/img/distribute-press.svg';
import { JobSubmissionPage } from './job-submission-page';
import Card from '../components/card';
import { JobProtocol } from './models/job-protocol';

initTheme();
initializeIcons();

const { spacing, palette } = getTheme();

const IconStyle = {
  root: {
    borderRadius: '100%',
    backgroundColor: palette.white,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '30%',
    boxShadow: `rgba(0, 0, 0, 0.06) 0px 2px 4px, rgba(0, 0, 0, 0.05) 0px 0.5px 1px`,
    width: 215,
    height: 215,
  },
  hover: {
    borderRadius: '100%',
    backgroundColor: palette.neutralLight,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '30%',
    boxShadow: `rgba(0, 0, 0, 0.06) 0px 2px 4px, rgba(0, 0, 0, 0.05) 0px 0.5px 1px`,
    width: 215,
    height: 215,
  },
  press: {
    borderRadius: '100%',
    backgroundColor: palette.white,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '30%',
    borderColor: palette.themePrimary,
    borderWidth: 3,
    width: 215,
    height: 215,
  },
};

const JobWizard = ({ setYamlText, history }) => {
  const uploadFile = React.createRef();

  const _importFile = event => {
    event.preventDefault();
    const files = event.target.files;
    if (!files || !files[0]) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      const text = String(fileReader.result);
      const valid = JobProtocol.validateFromYaml(text);
      if (valid) {
        alert(`Yaml file is invalid. ${valid}`);
        return;
      }
      try {
        setYamlText(text);
        history.push('/general');
      } catch (err) {
        alert(err.message);
      }
    });
    fileReader.readAsText(files[0]);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('op') === 'resubmit') {
      history.replace('/general');
    }
  }, []);

  return (
    <Card style={{ height: '90%', margin: `${spacing.l2}` }}>
      <Stack horizontalAlign='center' padding={100} gap={100}>
        <Text
          styles={{
            root: {
              color: palette.themePrimary,
              fontSize: FontSizes.xxLarge,
              fontWeight: FontWeights.semibold,
              alignItems: 'center',
              position: 'absolute',
            },
          }}
        >
          Select your job type
        </Text>
        <Stack
          horizontal
          horizontalAlign='center'
          gap={120}
          style={{ width: '100%', marginTop: 100 }}
        >
          <Stack horizontalAlign='center' gap={50}>
            <DefaultButton
              styles={{
                root: {
                  backgroundImage: `url(${uploadRoot})`,
                  ...IconStyle.root,
                },
                rootHovered: {
                  backgroundImage: `url(${uploadRoot})`,
                  ...IconStyle.hover,
                },
                rootPressed: {
                  backgroundImage: `url(${uploadPress})`,
                  ...IconStyle.press,
                },
              }}
              onClick={() => {
                uploadFile.current.click();
              }}
            />
            <input
              type='file'
              ref={uploadFile}
              style={{ display: 'none' }}
              accept='.yml,.yaml'
              onChange={_importFile}
            />
            <Text
              styles={{
                root: {
                  fontSize: FontSizes.large,
                  fontWeight: FontWeights.semibold,
                },
              }}
            >
              Import Config
            </Text>
          </Stack>
          <Stack horizontalAlign='center' gap={50}>
            <DefaultButton
              styles={{
                root: {
                  backgroundImage: `url(${singleRoot})`,
                  ...IconStyle.root,
                },
                rootHovered: {
                  backgroundImage: `url(${singleRoot})`,
                  ...IconStyle.hover,
                },
                rootPressed: {
                  backgroundImage: `url(${singlePress})`,
                  ...IconStyle.press,
                },
              }}
              onClick={() => {
                history.push('/single');
              }}
            />
            <Text
              styles={{
                root: {
                  fontSize: FontSizes.large,
                  fontWeight: FontWeights.semibold,
                },
              }}
            >
              Single Job
            </Text>
          </Stack>
          <Stack horizontalAlign='center' gap={50}>
            <DefaultButton
              styles={{
                root: {
                  backgroundImage: `url(${distributeRoot})`,
                  ...IconStyle.root,
                },
                rootHovered: {
                  backgroundImage: `url(${distributeRoot})`,
                  ...IconStyle.hover,
                },
                rootPressed: {
                  backgroundImage: `url(${distributePress})`,
                  ...IconStyle.press,
                },
              }}
              onClick={() => {
                history.push('/general');
              }}
            />
            <Text
              styles={{
                root: {
                  fontSize: FontSizes.large,
                  fontWeight: FontWeights.semibold,
                },
              }}
            >
              Distributed Job
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

JobWizard.propTypes = {
  setYamlText: PropTypes.func,
  history: PropTypes.object,
};

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
