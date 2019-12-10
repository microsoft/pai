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

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Fabric, Stack, StackItem } from 'office-ui-fabric-react';
import { isNil, isEmpty, get, cloneDeep } from 'lodash';
import PropTypes from 'prop-types';

import { JobInformation } from './components/job-information';
import { SubmissionSection } from './components/submission-section';
import { TaskRoles } from './components/task-roles';
import Context from './components/context';
import { fetchJobConfig, listUserVirtualClusters } from './utils/conn';
import { TaskRolesManager } from './utils/task-roles-manager';

// sidebar
import { Parameters } from './components/sidebar/parameters';
import { Secrets } from './components/sidebar/secrets';
import { EnvVar } from './components/sidebar/env-var';
import { DataComponent } from './components/data/data-component';
import { ToolComponent } from './components/tools/tool-component';
// models
import { Topbar } from './components/topbar/topbar';
import { JobBasicInfo } from './models/job-basic-info';
import { JobTaskRole } from './models/job-task-role';
import { JobData } from './models/data/job-data';
import { JobProtocol } from './models/job-protocol';
import {
  getJobComponentsFromConfig,
  isValidUpdatedTensorBoardExtras,
} from './utils/utils';
import { SpinnerLoading } from '../components/loading';
import config from '../config/webportal.config';
import { PAI_PLUGIN, PAI_STORAGE } from './utils/constants';

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

export const JobSubmissionPage = ({
  isSingle,
  history,
  yamlText,
  setYamlText,
}) => {
  const [jobTaskRoles, setJobTaskRolesState] = useState([
    new JobTaskRole({ name: 'taskrole' }),
  ]);
  const [parameters, setParametersState] = useState([{ key: '', value: '' }]);
  const [secrets, setSecretsState] = useState([{ key: '', value: '' }]);
  const [jobInformation, setJobInformation] = useState(() => {
    let suffix = Date.now().toString(16);
    suffix = suffix.substring(suffix.length - 6);
    let name = `${loginUser}_${suffix}`;
    name = name + getChecksum(name);
    return new JobBasicInfo({
      name: name,
      virtualCluster: 'default',
    });
  });
  const [selected, setSelected] = useState(SIDEBAR_PARAM);
  const [advanceFlag, setAdvanceFlag] = useState(false);
  const [jobData, setJobData] = useState(new JobData());
  const [extras, setExtras] = useState({});
  const [jobProtocol, setJobProtocol] = useState(new JobProtocol({}));
  const [loading, setLoading] = useState(true);

  // Context variables
  const [vcNames, setVcNames] = useState([]);
  const [storageConfigs, setStorageConfigs] = useState(undefined);
  const [errorMessages, setErrorMessages] = useState({});

  const setJobTaskRoles = useCallback(
    taskRoles => {
      if (isEmpty(taskRoles)) {
        setJobTaskRolesState([new JobTaskRole({ name: 'taskrole1' })]);
      } else {
        setJobTaskRolesState(taskRoles);
      }
    },
    [setJobTaskRolesState],
  );

  const setParameters = useCallback(
    param => {
      if (isEmpty(param)) {
        setParametersState([{ key: '', value: '' }]);
      } else {
        setParametersState(param);
      }
    },
    [setParametersState],
  );

  const setSecrets = useCallback(
    secret => {
      if (isEmpty(secret)) {
        setSecretsState([{ key: '', value: '' }]);
      } else {
        setSecretsState(secret);
      }
    },
    [setSecretsState],
  );

  const onSelect = useCallback(
    x => {
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
      setErrorMessages(prev => {
        if (isEmpty(msg)) {
          if (prev !== undefined && prev[id] !== undefined) {
            const updated = { ...prev };
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

  // fill protocol if cloned job
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('op') === 'resubmit' && !isEmpty(vcNames)) {
      const jobName = params.get('jobName') || '';
      const user = params.get('user') || '';
      if (user && jobName) {
        fetchJobConfig(user, jobName)
          .then(jobConfig => {
            const [
              jobInfo,
              taskRoles,
              parameters,
              ,
              extras,
            ] = getJobComponentsFromConfig(jobConfig, { vcNames });
            jobInfo.name = generateJobName(jobInfo.name);
            if (get(jobConfig, 'extras.submitFrom')) {
              delete jobConfig.extras.submitFrom;
            }
            setJobProtocol(new JobProtocol(jobConfig));
            setJobTaskRoles(taskRoles);
            setParameters(parameters);
            setJobInformation(jobInfo);
            setExtras(extras);
            setLoading(false);
          })
          .catch(alert);
      }
    } else {
      setLoading(false);
    }
  }, [vcNames]);

  // update component if yamlText is not null
  useEffect(() => {
    if (!isNil(yamlText)) {
      const updatedJob = JobProtocol.fromYaml(yamlText);
      if (isNil(updatedJob)) {
        return;
      }
      const [
        updatedJobInformation,
        updatedTaskRoles,
        updatedParameters,
        updatedSecrets,
        updatedExtras,
      ] = getJobComponentsFromConfig(updatedJob, { vcNames });
      if (extras.tensorBoard) {
        const updatedTensorBoardExtras = updatedExtras.tensorBoard || {};
        if (
          !isValidUpdatedTensorBoardExtras(
            extras.tensorBoard,
            updatedTensorBoardExtras,
          )
        ) {
          updatedExtras.tensorBoard = extras.tensorBoard;
        }
      }
      setJobInformation(updatedJobInformation);
      setJobTaskRolesState(updatedTaskRoles);
      setParameters(updatedParameters);
      setSecrets(updatedSecrets);
      setExtras(updatedExtras);
      setJobProtocol(updatedJob);
    }
  }, []);

  // Init plugins for pure k8s based PAI
  useEffect(() => {
    if (config.launcherType === 'k8s') {
      const plugin = get(extras, PAI_PLUGIN);
      if (!plugin) {
        // Init SSH default settings for old/empty jobs
        const updatedPlugin = [
          {
            plugin: 'ssh',
            parameters: {
              jobssh: true,
            },
          },
        ];
        const updatedExtras = cloneDeep(extras);
        updatedExtras[PAI_PLUGIN] = updatedPlugin;
        setExtras(updatedExtras);
      }

      setStorageConfigs(get(extras, PAI_STORAGE));
    }
  }, [extras]);

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

  useEffect(() => {
    listUserVirtualClusters(loginUser)
      .then(virtualClusters => {
        setVcNames(virtualClusters);
      })
      .catch(alert);
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
      <Fabric style={{ height: '100%', overflowX: 'auto' }}>
        <Stack
          styles={{ root: { height: '100%', minWidth: 1000, minHeight: 720 } }}
          verticalAlign='space-between'
          gap='m' // form has 4px(s2)'s bottom padding, so the total padding is still 4 + 16 = 20px (l1)
          padding='l1'
        >
          <Stack gap='l1' styles={{ root: { minHeight: 0 } }}>
            <StackItem disableShrink>
              <Topbar
                jobData={jobData}
                jobProtocol={jobProtocol}
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
                extras={extras}
                isSingle={isSingle}
                history={history}
                setYamlText={setYamlText}
              />
            </StackItem>
            {/* top - form */}
            <Stack styles={{ root: { minHeight: 0 } }} horizontal gap='l1'>
              {/* left column */}
              <StackItem
                grow
                styles={{ root: { minWidth: 700, flexBasis: 0 } }}
              >
                <Stack
                  gap='l1'
                  padding='0 0 s2'
                  styles={{ root: { height: '100%' } }}
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
                    isSingle={isSingle}
                  />
                </Stack>
              </StackItem>
              {/* right column */}
              <StackItem shrink styles={{ root: { overflowX: 'auto' } }}>
                <Stack
                  gap='l1'
                  padding='0 0 s2'
                  styles={{ root: { height: '100%', width: 550 } }}
                >
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
                    storageConfigs={storageConfigs}
                  />
                  <ToolComponent
                    selected={selected === SIDEBAR_TOOL}
                    onSelect={selectTool}
                    jobData={jobData}
                    taskRoles={jobTaskRoles}
                    extras={extras}
                    onExtrasChange={setExtras}
                  />
                </Stack>
              </StackItem>
            </Stack>
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
            jobProtocol={jobProtocol}
            setJobProtocol={setJobProtocol}
            history={history}
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
            isSingle={isSingle}
          />
        </Stack>
      </Fabric>
    </Context.Provider>
  );
};

JobSubmissionPage.propTypes = {
  isSingle: PropTypes.bool,
  history: PropTypes.object,
  yamlText: PropTypes.string,
  setYamlText: PropTypes.func,
};
