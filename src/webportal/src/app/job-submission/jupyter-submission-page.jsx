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
import { Fabric, Stack, StackItem, DefaultPalette, Text, TextField,
         Toggle, Dropdown, PrimaryButton, DefaultButton,
         mergeStyleSets} from 'office-ui-fabric-react';
import { isNil, isEmpty, get, cloneDeep } from 'lodash';
import PropTypes from 'prop-types';
import { VirtualCluster } from './components/virtual-cluster';
import { FormTextField } from './components/form-text-field';
import { BasicSection } from './components/basic-section';
import { FormShortSection } from './components/form-page';
import { SpinnerLoading } from '../components/loading';

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
import config from '../config/webportal.config';
import { PAI_PLUGIN, PAI_STORAGE } from './utils/constants';

const styles = mergeStyleSets({
  form: {
    width: "60%",
    marginTop: "20px",
    alignSelf: "center",
    boxSizing: "border-box",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)",
    borderStyle: "1px solid rgba(0, 0, 0, 0.2)",
    borderRadius: "6px",
    backgroundColor: DefaultPalette.white,
  },

  title: {
    fontWeight: "500",
  },

  subTitle: {
    fontSize: "16px",
    fontWeight: "300",
    color: DefaultPalette.neutralSecondary,
  },

  header: {
    width: "80%",
    paddingBottom: "20px",
    borderBottom: `1px solid ${DefaultPalette.neutralLight}`,
  },

  footer: {
    width: "80%",
    paddingTop: "20px",
    borderTop: `1px solid ${DefaultPalette.neutralLight}`,
  },

  item: {
    width: "100%",
    paddingLeft: "10%",
  },

  fileItem: {
    width: "80%",
    paddingRight: "5%",
  },

  fileLabel: {
    width: "25%",
    position: "relative",
    minHeight: "1px",
    padding: "0",
  },

  fileBtn: {
    fontSize: "14px",
    fontWeight: "400",
    boxSizing: "border-box",
    display: "inline-block",
    textAlign: "center",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    cursor: "pointer !important",
    touchAction: "manipulation",
    padding: "4px 16px",
    minWidth: "80px",
    height: "32px",
    backgroundColor: DefaultPalette.neutralLighter,
    color: `${DefaultPalette.black} !important`,
    userSelect: "none",
    outline: "transparent",
    border: "1px solid transparent",
    borderRadius: "0px",
    textDecoration: "none !important",
  },

  fileDisabled: {
    cursor: "not-allowed",
    filter: "alpha(opacity=60)",
    opacity: "0.60",
    boxShadow: "none",
    color: DefaultPalette.neutralLighterAlt,
    pointerEvents: "none",
  },

  fileInput: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    border: "0",
  },
});

const loginUser = cookies.get('user');

function generateJupyterJobName(){
  let suffix = Date.now().toString(16);
  suffix = suffix.substring(suffix.length - 6);
  const jobName = `${loginUser}_jupyter_${suffix}`;
  return jobName
}

const ENVIRONMENT_OPTIONS = [
{
  key: "pytorch1.3py3",
  text: "Python 3.6 + PyTorch 1.3 + Jupyter Notebook",
  image: "openpai/jupyter_py36_pytorch1.3",
},
{
  key: "tf1.15py3",
  text: "Python 3.6 + TensorFlow 1.15 + Jupyter Notebook",
  image: "openpai/jupyter_py36_tf1.15",
},
];

const RESOURCE_OPTIONS = [
{
  key: "1gpu4cpu8g",
  gpuNum: 1,
  cpuNum: 1,
  memoryMB: 8192,
  text: "1 GPU + 4 CPUs + 8G Memory",
},
{
  key: "0gpu4cpu8g",
  gpuNum: 0,
  cpuNum: 1,
  memoryMB: 8192,
  text: "0 GPU + 4 CPUs + 8G Memory",
},
{
  key: "1gpu4cpu16g",
  gpuNum: 1,
  cpuNum: 1,
  memoryMB: 8192,
  text: "1 GPU + 4 CPUs + 16G Memory",
},
];

export const JupyterSubmissionPage = ({
  isSingle,
  history,
  yamlText,
  setYamlText,
}) => {
  const [jobName, setJobName] = useState("");
  const [allVcNames, setAllVcNames] = useState([]);
  const [vcName, setVcName] = useState("");
  const [resource, setResource] = useState(RESOURCE_OPTIONS[0]);
  const [environment, setEnvironment] = useState(ENVIRONMENT_OPTIONS[0]);
  useEffect(() =>{
    setJobName(generateJupyterJobName());
  }, []);
  useEffect(() => {
    listUserVirtualClusters(loginUser)
      .then(virtualClusters => {
        setAllVcNames(virtualClusters.map(
          vc => { return {key: vc, text: vc}}
        ));
        setVcName(virtualClusters[0]);
      })
      .catch(alert);
  }, []);

  const onVcNameChange = useCallback((_, item) => {
    setVcName(item.key);
  }, []);

  const onEnvironmentChange = useCallback((_, item) => {
    setEnvironment(item);
  }, []);

  const onResourceChange = useCallback((_, item) => {
    setResource(item);
  }, []);

  useEffect(() => {
    console.log(jobName, vcName, resource, environment);
  }, [jobName, vcName, resource, environment])

  return (
    <Fabric>
      <Stack>
        {(vcName === "") && (
          <SpinnerLoading />
        )}
        {(vcName !== "") && (
          <Stack gap={20} padding={20} horizontalAlign="center" className={styles.form}>
            <Stack horizontal={true} horizontalAlign="center" className={styles.header}>
              <Text variant="xxLarge" className={styles.title}>
                Start a Jupyter Notebook
              </Text>
            </Stack>
            <Stack className={styles.item}>
              <FormTextField
                sectionLabel={'Job name'}
                value={jobName}
                shortStyle
                placeholder='Enter job name'
              />
            </Stack>
            <Stack className={styles.item}>
              <BasicSection sectionLabel='Virtual Cluster'>
                <Stack horizontal gap='l1'>
                  <FormShortSection>
                    <Dropdown
                      options={allVcNames}
                      onChange={onVcNameChange}
                      selectedKey={vcName}
                    />
                  </FormShortSection>
                  </Stack>
              </BasicSection>
            </Stack>
            <Stack className={styles.item}>
               <BasicSection sectionLabel='Resource'>
                <Stack horizontal gap='l1'>
                  <FormShortSection>
                    <Dropdown
                      options={RESOURCE_OPTIONS}
                      onChange={onResourceChange}
                      selectedKey={resource.key}
                    />
                  </FormShortSection>
                  </Stack>
              </BasicSection>
            </Stack>
            <Stack className={styles.item}>
               <BasicSection sectionLabel='Environment'>
                <Stack horizontal gap='l1'>
                  <FormShortSection>
                    <Dropdown
                      options={ENVIRONMENT_OPTIONS}
                      onChange={onEnvironmentChange}
                      selectedKey={environment.key}
                    />
                  </FormShortSection>
                  </Stack>
              </BasicSection>
            </Stack>
            <Stack gap={20} horizontal={true} horizontalAlign="end" className={styles.footer}>
              <PrimaryButton text="Submit" />
            </Stack>
          </Stack>
        )}
      </Stack>
    </Fabric>
  );
};

JupyterSubmissionPage.propTypes = {
  isSingle: PropTypes.bool,
  history: PropTypes.object,
  yamlText: PropTypes.string,
  setYamlText: PropTypes.func,
};
