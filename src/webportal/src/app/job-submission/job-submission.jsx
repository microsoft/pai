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

import React, {useState, useCallback, useEffect, useMemo} from 'react';
import ReactDOM from 'react-dom';
import {
  Fabric,
  Stack,
  initializeIcons,
  StackItem,
} from 'office-ui-fabric-react';
import {isEmpty, get} from 'lodash';

import {JobInformation} from './components/job-information';
import {getFormClassNames} from './components/form-style';
import {SubmissionSection} from './components/submission-section';
import {TaskRoles} from './components/task-roles';
import Context from './components/context';
import {fetchJobConfig, listUserVirtualClusters} from './utils/conn';
import {getJobComponentsFromConfig} from './utils/utils';
import {TaskRolesManager} from './utils/task-roles-manager';
import {initTheme} from '../components/theme';
import {SpinnerLoading} from '../components/loading';

// sidebar
import {Parameters} from './components/sidebar/parameters';
import {Secrets} from './components/sidebar/secrets';
import {EnvVar} from './components/sidebar/env-var';
import {DataComponent} from './components/data/data-component';
import {ToolComponent} from './components/tools/tool-component';
// models
import {JobBasicInfo} from './models/job-basic-info';
import {JobTaskRole} from './models/job-task-role';
import {JobData} from './models/data/job-data';
import {JobProtocol} from './models/job-protocol';

initTheme();
initializeIcons();

const formLayout = getFormClassNames().formLayout;

const SIDEBAR_PARAM = 'param';
const SIDEBAR_SECRET = 'secret';
const SIDEBAR_ENVVAR = 'envvar';
const SIDEBAR_DATA = 'data';
const SIDEBAR_TOOL = 'tool';

const loginUser = cookies.get('user');

function getChecksum(str) {
  let res = 0;
  for (const c of str) {
    res ^= c.charCodeAt(0) & 0xff;
  }
  return res.toString(16);
}

function generateJobName(jobName) {
  let name = jobName;
  if (
    /_\w{8}$/.test(name) &&
    getChecksum(name.slice(0, -2)) === name.slice(-2)
  ) {
    name = name.slice(0, -9);
  }

  let suffix = Date.now().toString(16);
  suffix = suffix.substring(suffix.length - 6);
  name = `${name}_${suffix}`;
  name = name + getChecksum(name);
  return name;
}

const JobSubmission = () => {
  const [jobTaskRoles, setJobTaskRolesState] = useState([
    new JobTaskRole({name: 'Task_role_1'}),
  ]);
  const [parameters, setParametersState] = useState([{key: '', value: ''}]);
  const [secrets, setSecretsState] = useState([{key: '', value: ''}]);
  const [jobInformation, setJobInformation] = useState(
    new JobBasicInfo({
      name: `${loginUser}_${Date.now()}`,
      virtualCluster: 'default',
    }),
  );
  const [selected, setSelected] = useState(SIDEBAR_PARAM);
  const [advanceFlag, setAdvanceFlag] = useState(false);
  const [jobData, setJobData] = useState(new JobData());
  const [extras, setExtras] = useState({});
  const [loading, setLoading] = useState(true);
  const [initJobProtocol, setInitJobProtocol] = useState(new JobProtocol({}));

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
  }, [jobTaskRoles]);

  const setJobTaskRoles = useCallback(
    (taskRoles) => {
      if (isEmpty(taskRoles)) {
        setJobTaskRolesState([new JobTaskRole({name: 'Task_role_1'})]);
      } else {
        setJobTaskRolesState(taskRoles);
      }
    },
    [setJobTaskRolesState],
  );

  useEffect(() => {
    const taskRolesManager = new TaskRolesManager(jobTaskRoles);
    const isUpdated = taskRolesManager.populateTaskRolesWithUpdatedSecret(
      secrets,
    );
    if (isUpdated) {
      taskRolesManager.populateTaskRolesDockerInfo();
      setJobTaskRoles(jobTaskRoles);
    }
  }, [secrets]);

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
      setErrorMessages((prev) => {
        if (isEmpty(msg)) {
          if (prev !== undefined && prev[id] !== undefined) {
            const updated = {...prev};
            delete updated[id];
            return updated;
          }
        } else {
          if (prev !== undefined && prev[id] !== msg) {
            return {
              ...prev,
              [id]: msg,
            };
          }
        }
        return prev;
      });
    },
    [setErrorMessages],
  );

  const contextValue = useMemo(
    () => ({
      vcNames,
      errorMessages,
      setErrorMessage,
    }),
    [vcNames, errorMessages, setErrorMessage],
  );

  useEffect(() => {
    listUserVirtualClusters(loginUser)
      .then((virtualClusters) => {
        setVcNames(virtualClusters);
      })
      .catch(alert);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('op') === 'resubmit') {
      const jobName = params.get('jobname') || '';
      const user = params.get('user') || '';
      if (user && jobName) {
        fetchJobConfig(user, jobName)
          .then((jobConfig) => {
            const [jobInfo, taskRoles, parameters] = getJobComponentsFromConfig(
              jobConfig,
              {vcNames}
            );
            jobInfo.name = generateJobName(jobInfo.name);
            if (get(jobConfig, 'extras.submitFrom')) {
              delete jobConfig.extras.submitFrom;
            }
            setInitJobProtocol(new JobProtocol(jobConfig));
            setJobTaskRoles(taskRoles);
            setParameters(parameters);
            setJobInformation(jobInfo);
            setLoading(false);
          })
          .catch(alert);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const onToggleAdvanceFlag = useCallback(() => {
    setAdvanceFlag(!advanceFlag);
  }, [advanceFlag, setAdvanceFlag]);

  const selectParam = useCallback(() => onSelect(SIDEBAR_PARAM), [onSelect]);
  const selectSecret = useCallback(() => onSelect(SIDEBAR_SECRET), [onSelect]);
  const selectEnv = useCallback(() => onSelect(SIDEBAR_ENVVAR), [onSelect]);
  const selectData = useCallback(() => onSelect(SIDEBAR_DATA), [onSelect]);
  const selectTool = useCallback(() => onSelect(SIDEBAR_TOOL), [onSelect]);

  if (loading) {
    return <SpinnerLoading />;
  }

  return (
    <Context.Provider value={contextValue}>
      <Fabric style={{height: '100%', overflowX: 'auto'}}>
        <Stack
          className={formLayout}
          styles={{root: {height: '100%', minWidth: 1000}}}
          verticalAlign='space-between'
          gap='l1'
        >
          {/* top - form */}
          <Stack
            styles={{root: {minHeight: 0}}}
            horizontal
            gap='l1'
          >
            {/* left column */}
            <StackItem grow styles={{root: {minWidth: 600, flexBasis: 0}}}>
              <Stack
                gap='l1'
                styles={{root: {height: '100%'}}}
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
              </Stack>
            </StackItem>
            {/* right column */}
            <StackItem shrink styles={{root: {overflowX: 'auto'}}}>
              <Stack gap='l1' styles={{root: {height: '100%', width: 550}}}>
                <Parameters
                  parameters={parameters}
                  onChange={setParameters}
                  selected={selected === SIDEBAR_PARAM}
                  onSelect={selectParam}
                />
                <Secrets
                  secrets={secrets}
                  onChange={setSecrets}
                  selected={selected === SIDEBAR_SECRET}
                  onSelect={selectSecret}
                />
                <EnvVar
                  selected={selected === SIDEBAR_ENVVAR}
                  onSelect={selectEnv}
                />
                <DataComponent
                  selected={selected === SIDEBAR_DATA}
                  onSelect={selectData}
                  jobName={jobInformation.name}
                  onChange={setJobData}
                />
                <ToolComponent
                  selected={selected === SIDEBAR_TOOL}
                  onSelect={selectTool}
                  jobData={jobData}
                  taskRoles={jobTaskRoles}
                  extras={extras}
                  onChange={setExtras}
                />
              </Stack>
            </StackItem>
          </Stack>
          {/* bottom - buttons */}
          <SubmissionSection
            jobInformation={jobInformation}
            jobTaskRoles={jobTaskRoles}
            parameters={parameters}
            secrets={secrets}
            extras={extras}
            advanceFlag={advanceFlag}
            onToggleAdvanceFlag={onToggleAdvanceFlag}
            jobData={jobData}
            initJobProtocol={initJobProtocol}
            onChange={(
              updatedJobInfo,
              updatedTaskRoles,
              updatedParameters,
              updatedSecrets,
              updatedExtras,
            ) => {
              setJobInformation(updatedJobInfo);
              setJobTaskRoles(updatedTaskRoles);
              setParameters(updatedParameters);
              setSecrets(updatedSecrets);
              setExtras(updatedExtras);
            }}
          />
        </Stack>
      </Fabric>
    </Context.Provider>
  );
};

const contentWrapper = document.getElementById('content-wrapper');

document.getElementById('sidebar-menu--job-submission').classList.add('active');
ReactDOM.render(<JobSubmission />, contentWrapper);

function layout() {
  setTimeout(function() {
    contentWrapper.style.height = contentWrapper.style.minHeight;
  }, 10);
}

window.addEventListener('resize', layout);
window.addEventListener('load', layout);
