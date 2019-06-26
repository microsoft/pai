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

import React, {useState, useCallback, useEffect} from 'react';
import ReactDOM from 'react-dom';
import {
  Fabric,
  Stack,
  initializeIcons,
  StackItem,
  MessageBar,
  MessageBarType,
} from 'office-ui-fabric-react';
import {JobInformation} from './components/job-information';
import {getFormClassNames} from './components/form-style';
import {initTheme} from '../components/theme';
import {SubmissionSection} from './components/submission-section';
import {TaskRoles} from './components/task-roles';
import {fetchJobConfig, listVirtualClusters} from './utils/conn';
import {getJobComponentsFormConfig} from './utils/utils';
import {TaskRolesManager} from './utils/task-roles-manager';
import Context from './components/context';

import {isEmpty} from 'lodash';
import PropTypes from 'prop-types';
// sidebar
import {Parameters} from './components/sidebar/parameters';
import {Secrets} from './components/sidebar/secrets';
import {EnvVar} from './components/sidebar/env-var';
import {DataComponent} from './components/data/data-component';
// models
import {JobBasicInfo} from './models/job-basic-info';
import {JobTaskRole} from './models/job-task-role';
import {JobData} from './models/data/job-data';

initTheme();
initializeIcons();

const formLayout = getFormClassNames().formLayout;

const SIDEBAR_PARAM = 'param';
const SIDEBAR_SECRET = 'secret';
const SIDEBAR_ENVVAR = 'envvar';
const SIDEBAR_DATA = 'data';

const JobSubmission = (props) => {
  const [jobTaskRoles, setJobTaskRolesState] = useState(props.jobTaskRoles);
  const [parameters, setParametersState] = useState(props.jobParameters);
  const [secrets, setSecretsState] = useState([{key: '', value: ''}]);
  const [jobInformation, setJobInformation] = useState(props.jobBasicInfo);
  const [selected, setSelected] = useState(SIDEBAR_PARAM);
  const [advanceFlag, setAdvanceFlag] = useState(false);
  const [jobData, setJobData] = useState(new JobData());

  // Context variables
  const [vcNames, setVcNames] = useState([]);
  const [errorMessages, setErrorMessages] = useState({});

  useEffect(() => {
    // docker info will be updated in-place
    const preTaskRoles = JSON.stringify(jobTaskRoles);
    const taskRolesManager = new TaskRolesManager(jobTaskRoles);
    taskRolesManager.populateTaskRolesDockerInfo();
    const [
      updatedSecrets,
      isUpdated,
    ] = taskRolesManager.getUpdatedSecretsAndLinkTaskRoles(secrets);

    const curTaskRoles = JSON.stringify(jobTaskRoles);
    if (preTaskRoles !== curTaskRoles) {
      setJobTaskRolesState(jobTaskRoles);
    }

    if (isUpdated) {
      setSecrets(updatedSecrets);
    }
  }, [jobTaskRoles, secrets]);

  const setJobTaskRoles = useCallback(
    (taskRoles) => {
      if (isEmpty(taskRoles)) {
        setJobTaskRolesState([new JobTaskRole({})]);
      } else {
        setJobTaskRolesState(taskRoles);
      }
    },
    [setJobTaskRolesState],
  );

  const setParameters = useCallback(
    (param) => {
      if (isEmpty(param)) {
        setParametersState([{key: '', value: ''}]);
      } else {
        setParametersState(param);
      }
    },
    [setParametersState],
  );

  const setSecrets = useCallback(
    (secret) => {
      if (isEmpty(secret)) {
        setSecretsState([{key: '', value: ''}]);
      } else {
        setSecretsState(secret);
      }
    },
    [setSecretsState],
  );

  const onSelect = useCallback(
    (x) => {
      if (x === selected) {
        setSelected(null);
      } else {
        setSelected(x);
      }
    },
    [selected, setSelected],
  );

  const setErrorMessage = useCallback(
    (id, msg) => {
      if (isEmpty(msg)) {
        const updated = {...errorMessages};
        delete updated[id];
        setErrorMessages(updated);
      } else {
        setErrorMessages({
          ...errorMessages,
          [id]: msg,
        });
      }
    },
    [errorMessages, setErrorMessages],
  );

  useEffect(() => {
    listVirtualClusters()
      .then((virtualClusters) => {
        setVcNames(Object.keys(virtualClusters));
      })
      .catch(alert);
  }, []);

  const onToggleAdvanceFlag = useCallback(() => {
    setAdvanceFlag(!advanceFlag);
  }, [advanceFlag, setAdvanceFlag]);

  return (
    <Context.Provider value={{vcNames, errorMessages, setErrorMessage}}>
      <Fabric style={{height: '100%'}}>
        <Stack style={{height: '100%'}}>
          {!isEmpty(errorMessages) && (
            Object.entries(errorMessages).filter(([id, msg]) => !isEmpty(msg)).map(([id, msg]) => (
              <MessageBar
                key={id}
                messageBarType={MessageBarType.error}
                truncated={true}
              >
                {msg}
              </MessageBar>
            ))
          )}
          <StackItem grow styles={{root: {minHeight: 0}}}>
            <Stack
              className={formLayout}
              styles={{root: {height: '100%'}}}
              horizontal
              gap='l1'
            >
              {/* left column */}
              <StackItem grow shrink styles={{root: {minWidth: 0}}}>
                <Stack
                  gap='l2'
                  styles={{root: {height: '100%', overflowY: 'auto'}}}
                >
                  <JobInformation
                    jobInformation={jobInformation}
                    onChange={setJobInformation}
                    advanceFlag={advanceFlag}
                  />
                  <TaskRoles
                    taskRoles={jobTaskRoles}
                    onChange={setJobTaskRoles}
                    advanceFlag={advanceFlag}
                  />
                  <SubmissionSection
                    jobInformation={jobInformation}
                    jobTaskRoles={jobTaskRoles}
                    parameters={parameters}
                    secrets={secrets}
                    advanceFlag={advanceFlag}
                    onToggleAdvanceFlag={onToggleAdvanceFlag}
                    jobData={jobData}
                    onChange={(
                      updatedJobInfo,
                      updatedTaskRoles,
                      updatedParameters,
                      updatedSecrets,
                    ) => {
                      setJobInformation(updatedJobInfo);
                      setJobTaskRoles(updatedTaskRoles);
                      setParameters(updatedParameters);
                      setSecrets(updatedSecrets);
                    }}
                  />
                </Stack>
              </StackItem>
              {/* right column */}
              <StackItem disableShrink styles={{root: {width: 600}}}>
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
                    onChange={setJobData}
                  />
                </Stack>
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
      </Fabric>
    </Context.Provider>
  );
};

JobSubmission.propTypes = {
  jobBasicInfo: PropTypes.instanceOf(JobBasicInfo).isRequired,
  jobTaskRoles: PropTypes.array.isRequired,
  jobParameters: PropTypes.array.isRequired,
};

function onRenderJobSubmission(contentWrapper) {
  const params = new URLSearchParams(window.location.search);
  const props = {
    jobTaskRoles: [new JobTaskRole({})],
    jobParameters: [{key: '', value: ''}],
    jobBasicInfo: new JobBasicInfo({
      name: `${cookies.get('user')}_${Date.now()}`,
      virtualCluster: 'default',
    }),
  };
  if (params.get('op') === 'resubmit') {
    const jobName = params.get('jobname') || '';
    const user = params.get('user') || '';
    if (user && jobName) {
      fetchJobConfig(user, jobName)
        .then((jobConfig) => {
          const [jobInfo, taskRoles, parameters] = getJobComponentsFormConfig(
            jobConfig,
          );
          props.jobBasicInfo = jobInfo;
          props.jobTaskRoles = taskRoles;
          props.jobParameters = parameters;
          ReactDOM.render(<JobSubmission {...props} />, contentWrapper);
        })
        .catch((err) => {
          alert(err);
        });
    }
  } else {
    ReactDOM.render(<JobSubmission {...props} />, contentWrapper);
  }
}

const contentWrapper = document.getElementById('content-wrapper');
onRenderJobSubmission(contentWrapper);

document.getElementById('sidebar-menu--job-submission').classList.add('active');

function layout() {
  setTimeout(function() {
    contentWrapper.style.height = contentWrapper.style.minHeight;
  }, 10);
}

window.addEventListener('resize', layout);
window.addEventListener('load', layout);
