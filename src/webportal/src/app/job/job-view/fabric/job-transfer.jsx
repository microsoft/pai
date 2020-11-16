// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState, useRef } from 'react';
import {
  Stack,
  StackItem,
  Text,
  TextField,
  Dropdown,
  PrimaryButton,
  DefaultButton,
  ColorClassNames,
  getTheme,
  mergeStyleSets,
} from 'office-ui-fabric-react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import ReactDOM from 'react-dom';
import { jobProtocolSchema } from '../../../job-submission/models/protocol-schema';
import qs from 'querystring';
import Joi from 'joi-browser';
import yaml from 'js-yaml';

import { SpinnerLoading } from '../../../components/loading';
import MonacoPanel from '../../../components/monaco-panel';

import _ from 'lodash';
import InfoBox from './job-transfer/info-box';
import StopBox from './job-transfer/stop-box';
import {
  fetchBoundedClusters,
  fetchJobConfig,
  fetchJobState,
  transferJob,
} from './job-transfer/conn';

const params = new URLSearchParams(window.location.search);
// the user who is viewing this page
const userName = cookies.get('user');
// the user of the job
const userNameOfTheJob = params.get('userName');
const jobName = params.get('jobName');

const JOB_PROTOCOL_SCHEMA_URL =
  'https://github.com/microsoft/openpai-protocol/blob/master/schemas/v2/schema.yaml';

const { palette } = getTheme();

const styles = mergeStyleSets({
  form: {
    width: '35%',
    marginTop: '30px',
    alignSelf: 'center',
    boxSizing: 'border-box',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    borderStyle: '1px solid rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    backgroundColor: palette.white,
  },

  title: {
    fontWeight: '500',
  },

  subTitle: {
    fontWeight: '200',
    textAlign: 'center',
  },

  header: {
    width: '80%',
    paddingBottom: '20px',
    borderBottom: `1px solid ${palette.neutralLight}`,
  },

  footer: {
    width: '80%',
    paddingTop: '20px',
    borderTop: `1px solid ${palette.neutralLight}`,
  },

  item: {
    width: '100%',
    paddingLeft: '20%',
    paddingRight: '20%',
  },
});

// light-weight helper class for job config
class JobConfig {
  constructor(jobConfig) {
    if (_.isObject(jobConfig)) {
      this._jobConfig = _.cloneDeep(jobConfig);
    } else {
      throw new Error('The job config is not a valid!');
    }
  }

  getObject() {
    return this._jobConfig;
  }

  validate() {
    const result = Joi.validate(this._jobConfig, jobProtocolSchema);
    if (result.error === null) {
      return [true, ''];
    } else {
      return [false, result.error.message];
    }
  }

  static validateFromYAML(yamlText) {
    try {
      const jobConfig = new JobConfig(yaml.safeLoad(yamlText));
      return jobConfig.validate();
    } catch (err) {
      return [false, err.message];
    }
  }

  getYAML() {
    return yaml.safeDump(this._jobConfig);
  }
}

const JobTransferPage = () => {
  const [loading, setLoading] = useState(true);
  const [boundedClusters, setBoundedClusters] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [jobConfig, setJobConfig] = useState(new JobConfig({}));
  const [transferring, setTransferring] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [infoBoxProps, setInfoBoxProps] = useState({});
  const [showStopBox, setShowStopBox] = useState(false);
  const [jobStateInStopBox, setJobStateInStopBox] = useState('UNKNOWN');
  const [showEditor, setShowEditor] = useState(false);
  const [editorYAML, setEditorYAML] = useState('');
  const [isConfigValid, configValidationError] = jobConfig.validate();
  const [
    isEditorYAMLValid,
    editorYAMLValidationError,
  ] = JobConfig.validateFromYAML(editorYAML);

  const onDismissInfoBox = () => {
    setShowInfoBox(false);
    setInfoBoxProps({});
  };

  const onDismissStopBox = () => {
    setShowStopBox(false);
  };

  const monaco = useRef(null);

  if (userName !== userNameOfTheJob) {
    // currently, we only allow user transfer his own job.
    setShowInfoBox(true);
    setInfoBoxProps({
      title: 'Notice',
      message: 'You can only transfer your job.',
      onDismiss: onDismissInfoBox,
      redirectURL: `job-detail.html?${qs.stringify({
        username: userNameOfTheJob,
        jobName: jobName,
      })}`,
    });
  }

  const fetchInfo = async () => {
    const [boundedClustersInfo, jobConfigInfo] = await Promise.all([
      fetchBoundedClusters(userName),
      fetchJobConfig(userName, jobName),
    ]);
    if (_.isEmpty(boundedClustersInfo)) {
      setShowInfoBox(true);
      setInfoBoxProps({
        title: 'Notice',
        message:
          "You haven't set up any bounded clusters yet, so the job cannot be transferred. " +
          'Please click OK to go to your profile page to set up some bounded clusters.',
        onDismiss: onDismissInfoBox,
        redirectURL: '/user-profile.html',
      });
      return;
    }
    setBoundedClusters(boundedClustersInfo);
    setJobConfig(new JobConfig(jobConfigInfo));
    setLoading(false);
  };

  const showError = e => {
    setShowInfoBox(true);
    setInfoBoxProps({
      title: 'Error',
      message: e.message,
      onDismiss: onDismissInfoBox,
    });
  };

  useEffect(() => {
    fetchInfo().catch(showError);
  }, []);

  const onClickTransfer = () => {
    (async () => {
      setTransferring(true);
      if (isConfigValid === false) {
        throw new Error(
          `There is an error in your job config. Please check. Details: ${configValidationError}.`,
        );
      }
      await transferJob(
        userName,
        jobName,
        _.merge(boundedClusters[selectedCluster], { alias: selectedCluster }),
        jobConfig.getObject(),
        jobConfig.getYAML(),
      );
      const currentJobState = await fetchJobState(userName, jobName);
      if (currentJobState === 'RUNNING' || currentJobState === 'WAITING') {
        // show stop box
        setShowStopBox(true);
        setJobStateInStopBox(currentJobState);
      } else {
        // show normal info box
        setShowInfoBox(true);
        setInfoBoxProps({
          title: 'Notice',
          message:
            'Your job has been successfully transferred! Please click OK to return to the job detail page.',
          onDismiss: onDismissInfoBox,
          redirectURL: `job-detail.html?${qs.stringify({
            username: userName,
            jobName: jobName,
          })}`,
        });
      }
    })()
      .catch(showError)
      .finally(() => {
        setTransferring(false);
      });
  };

  const onOpenEditor = () => {
    setEditorYAML(jobConfig.getYAML());
    setShowEditor(true);
  };

  const onCloseEditor = () => {
    setShowEditor(false);
  };

  const onSaveEditor = () => {
    try {
      const newJobConfig = new JobConfig(yaml.safeLoad(editorYAML));
      setJobConfig(newJobConfig);
      setShowEditor(false);
    } catch (err) {
      // This shouldn't happen because we have validated the YAML before saving.
      alert(err.message);
    }
  };

  const onEditorYAMLChange = text => {
    setEditorYAML(text);
  };

  return (
    <div>
      <InfoBox hidden={!showInfoBox} {...infoBoxProps} />
      <StopBox
        hidden={!showStopBox}
        userName={userName}
        jobName={jobName}
        jobState={jobStateInStopBox}
        onDismiss={onDismissStopBox}
      />
      {loading && <SpinnerLoading />}
      {!loading && (
        <Stack horizontal horizontalAlign='center'>
          <Stack
            gap={25}
            padding={20}
            horizontalAlign='center'
            className={styles.form}
          >
            <Stack className={styles.header} gap={12}>
              <Stack horizontal={true} horizontalAlign='center'>
                <Text variant='xxLarge' className={styles.title}>
                  Job Transfer
                </Text>
              </Stack>
              <Stack>
                <Text variant='medium' className={styles.subTitle}>
                  Please make sure configurations and dependencies using in the
                  job YAML are set properly in the target cluster.
                </Text>
              </Stack>
            </Stack>
            <Stack className={styles.item}>
              <Stack horizontal gap={10}>
                <Label required>Transfer to</Label>
                <Stack grow>
                  <Dropdown
                    placeholder={'select a bounded cluster'}
                    selectedKey={selectedCluster}
                    onChange={(_, item) => setSelectedCluster(item.key)}
                    options={(() => {
                      const options = [];
                      for (const alias in boundedClusters) {
                        options.push({ key: alias, text: alias });
                      }
                      return options;
                    })()}
                  />
                </Stack>
              </Stack>
            </Stack>
            <Stack className={styles.item}>
              <TextField
                label='Job Name'
                value={_.get(jobConfig.getObject(), 'name', '')}
                onChange={e => {
                  setJobConfig((prevJobConfig, props) => {
                    const newJobConfig = _.cloneDeep(jobConfig.getObject());
                    _.set(newJobConfig, 'name', e.target.value);
                    return new JobConfig(newJobConfig);
                  });
                }}
                required
              />
            </Stack>
            <Stack className={styles.item}>
              <TextField
                label='VC Name'
                value={_.get(
                  jobConfig.getObject(),
                  'defaults.virtualCluster',
                  '',
                )}
                onChange={e => {
                  setJobConfig((prevJobConfig, props) => {
                    const newJobConfig = _.cloneDeep(prevJobConfig.getObject());
                    _.set(
                      newJobConfig,
                      'defaults.virtualCluster',
                      e.target.value,
                    );
                    return new JobConfig(newJobConfig);
                  });
                }}
                required
              />
            </Stack>
            <Stack
              gap={20}
              horizontal={true}
              horizontalAlign='end'
              className={styles.footer}
            >
              {transferring && <Spinner size={SpinnerSize.medium} />}
              <PrimaryButton
                disabled={transferring || selectedCluster === ''}
                onClick={onClickTransfer}
                text='Confirm Transfer'
              />
              <DefaultButton
                disabled={transferring}
                onClick={onOpenEditor}
                text='Edit YAML'
              />
            </Stack>
          </Stack>
        </Stack>
      )}
      <MonacoPanel
        isOpen={showEditor}
        onDismiss={onCloseEditor}
        title='Protocol YAML Editor'
        header={
          <Stack grow horizontal horizontalAlign='end'>
            <DefaultButton
              onClick={() => window.open(JOB_PROTOCOL_SCHEMA_URL)}
              styles={{
                root: [ColorClassNames.neutralDarkBackground],
                rootHovered: [ColorClassNames.blackBackground],
                rootChecked: [ColorClassNames.blackBackground],
                rootPressed: [ColorClassNames.blackBackground],
                label: [ColorClassNames.white],
              }}
              text='Protocol Schema'
            />
          </Stack>
        }
        footer={
          <Stack horizontal horizontalAlign='space-between'>
            <StackItem>
              <Text className={{ color: palette.red }}>
                {editorYAMLValidationError}
              </Text>
            </StackItem>
            <StackItem>
              <PrimaryButton
                onClick={onSaveEditor}
                styles={{
                  rootDisabled: [
                    ColorClassNames.neutralSecondaryBackground,
                    ColorClassNames.black,
                  ],
                }}
                text='Save'
                disabled={isEditorYAMLValid === false}
              />
            </StackItem>
          </Stack>
        }
        monacoRef={monaco}
        monacoProps={{
          language: 'yaml',
          options: { wordWrap: 'on', readOnly: false },
          value: editorYAML,
          onChange: _.debounce(onEditorYAMLChange, 100),
        }}
      />
    </div>
  );
};

ReactDOM.render(
  <JobTransferPage />,
  document.getElementById('content-wrapper'),
);
