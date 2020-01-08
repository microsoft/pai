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
import { FormTextField, TEXT_FILED_REGX } from './components/form-text-field';
import { BasicSection } from './components/basic-section';
import { FormShortSection } from './components/form-page';
import { SpinnerLoading } from '../components/loading';
import { JupyterJobProtocol } from './models/jupyter-job-protocol';
import { submitJob, listUserVirtualClusters } from './utils/conn';

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
  key: "pytorch1.2py3",
  text: "Python 3.6 + PyTorch 1.2 + Jupyter Notebook",
  image: "openpai/jupyter_python36_pytorch1.2",
},
{
  key: "tf1.15py3",
  text: "Python 3.6 + TensorFlow 1.15 + Jupyter Notebook",
  image: "openpai/jupyter_python36_tensorflow1.15",
},
];

const RESOURCE_OPTIONS = [
{
  key: "1gpu4cpu8g",
  gpuNum: 1,
  cpuNum: 4,
  memoryMB: 8192,
  text: "1 GPU + 4 CPUs + 8G Memory",
},
{
  key: "1gpu4cpu16g",
  gpuNum: 1,
  cpuNum: 4,
  memoryMB: 16384,
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

  const onJobNameChange = useCallback(val => {
    setJobName(val);
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

  const getJobProtocol = useCallback(() => {
    const protocol = new JupyterJobProtocol({
      name: jobName,
      virtualCluster: vcName,
      gpuNum: resource.gpuNum,
      cpuNum: resource.cpuNum,
      memoryMB: resource.memoryMB,
      dockerImage: environment.image,
    });
    return protocol;
  }, [jobName, vcName, resource, environment]);

  const [jobProtocol, setJobProtocol] = useState(getJobProtocol());

  useEffect(() => {
    setJobProtocol(getJobProtocol());
  }, [jobName, vcName, resource, environment]);

  useEffect(() => {
    console.log(jobProtocol);
    console.log(JupyterJobProtocol.validateFromObject(jobProtocol));
  }, [jobProtocol]);

  const _submitJob = async event => {
    event.preventDefault();
    const protocol = cloneDeep(jobProtocol);
    try {
      await submitJob(protocol.toYaml());
      window.location.href = `/job-detail.html?username=${loginUser}&jobName=${protocol.name}`;
    } catch (err) {
      alert(err);
    }
  };

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
                onChange={onJobNameChange}
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
              <PrimaryButton
                text="Submit"
                disabled={(!isEmpty(JupyterJobProtocol.validateFromObject(jobProtocol)))
                  || (isEmpty(TEXT_FILED_REGX.exec(jobName)))}
                onClick={_submitJob}
              />
            </Stack>
          </Stack>
        )}
      </Stack>
    </Fabric>
  );
};

JupyterSubmissionPage.propTypes = {
  history: PropTypes.object,
};
