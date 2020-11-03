// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useEffect, useState, useCallback } from 'react';
import { Fabric, Stack, StackItem, DefaultPalette, Text, TextField,
         Toggle, Dropdown, PrimaryButton, DefaultButton, ActionButton,
         mergeStyleSets} from 'office-ui-fabric-react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import ReactDOM from 'react-dom';
import { isEmpty } from 'lodash';
import { FormTextField, TEXT_FILED_REGX } from '../../../job-submission/components/form-text-field';
import { JobProtocol } from '../../../job-submission/models/job-protocol';
import { jobProtocolSchema } from '../../../job-submission/models/protocol-schema';
import qs from 'querystring';
import Joi from 'joi-browser';
import yaml from 'js-yaml';

import { SpinnerLoading } from '../../../components/loading';

import _ from 'lodash';
import InfoBox from './job-transfer/info-box';
import { fetchBoundedClusters, fetchJobConfig, transferJob } from './job-transfer/conn';

const params = new URLSearchParams(window.location.search);
// the user who is viewing this page
const userName = cookies.get('user');
// the user of the job
const userNameOfTheJob = params.get('userName');
const jobName = params.get('jobName');

const styles = mergeStyleSets({
  form: {
    width: "35%",
    marginTop: "30px",
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
    paddingLeft: "20%",
    paddingRight: "20%",
  },

});

class JobConfig {
  constructor(jobConfig) {
    if (_.isObject(jobConfig)) {
      this._jobConfig = _.cloneDeep(jobConfig);
    } else {
      throw new Error("The job config is not a valid object!")
    }
  }

  getObject() {
    return this._jobConfig;
  }

  validate() {
    const result = Joi.validate(this._jobConfig, jobProtocolSchema);
    if (result.error === null) {
      return [true, ""];
    } else {
      return [false, result.error.message];
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

  const [isConfigValid, configValidationError] = jobConfig.validate();

  const onDismissInfoBox = () => {
    setShowInfoBox(false);
    setInfoBoxProps({});
  }

  if (userName !== userNameOfTheJob) {
    // currently, we only allow user transfer his own job.
    setShowInfoBox(true);
    setInfoBoxProps({
      title: 'Notice',
      message: "You can only transfer your job.",
      onDismiss: onDismissInfoBox,
      redirectURL: `job-detail.html?${qs.stringify({username: userNameOfTheJob, jobName: jobName})}`,
    });
  }

  const fetchInfo = async () => {
    const [boundedClustersInfo, jobConfigInfo] = await Promise.all([fetchBoundedClusters(userName), fetchJobConfig(userName, jobName)]);
    if (_.isEmpty(boundedClustersInfo)) {
      setShowInfoBox(true);
      setInfoBoxProps({
        title: 'Notice',
        message: "You haven't set up any bounded clusters yet, so the job cannot be transferred. " +
          "Please click OK to go to your profile page to set up some bounded clusters.",
        onDismiss: onDismissInfoBox,
        redirectURL: '/user-profile.html',
      });
      return;
    }
    setBoundedClusters(boundedClustersInfo);
    setJobConfig(new JobConfig(jobConfigInfo));
    setLoading(false);
  };

  const showError = (e) => {
    setShowInfoBox(true);
    setInfoBoxProps({
        title: 'Error',
        message: e.message,
        onDismiss: onDismissInfoBox,
    });
  }

  useEffect(() => { fetchInfo().catch(showError)}, []);

  const onClickTransfer = () => {
    (async () => {
      setTransferring(true);
      if (isConfigValid === false) {
        throw new Error(`There is an error in your job config. Please check. Details: ${configValidationError}.`)
      }
      await transferJob(
        userName,
        jobName,
        _.merge(boundedClusters[selectedCluster], {alias: selectedCluster}),
        jobConfig.getObject(),
        jobConfig.getYAML()
      );
    })()
    .catch(showError)
    .finally(() => {
      setTransferring(false);
    })
  }


  return (
    <div>
      <InfoBox hidden={!showInfoBox} {...infoBoxProps} />
      {loading && <SpinnerLoading />}
      {!loading && (
        <Stack horizontal horizontalAlign="center">
          <Stack gap={25} padding={20} horizontalAlign="center" className={styles.form}>
            <Stack horizontal={true} horizontalAlign="center" className={styles.header}>
              <Text variant="xxLarge" className={styles.title}>
                Job Transfer
              </Text>
            </Stack>
            <Stack className={styles.item}>
              <Stack horizontal gap={10}>
                <Label required>Transfer to</Label>
                <Dropdown
                  placeholder={"select a cluster"}
                  selectedKey={selectedCluster}
                  onChange={(_, item) => setSelectedCluster(item.key)}
                  options={(() => {
                    const options = [];
                    for (let alias in boundedClusters) {
                      options.push({key: alias, text: alias})
                    }
                    return options
                  })()}
                />
              </Stack>
            </Stack>
            <Stack className={styles.item}>
              <TextField label="Job Name"
                value={_.get(jobConfig.getObject(), 'name', '')}
                onChange={e=> {
                  setJobConfig((prevJobConfig, props) => {
                    const newJobConfig = _.cloneDeep(jobConfig.getObject())
                    _.set(newJobConfig, 'name', e.target.value);
                    return new JobConfig(newJobConfig);
                  })
                }}
                required
               />
            </Stack>
            <Stack className={styles.item}>
              <TextField
                label="VC Name"
                value={_.get(jobConfig.getObject(), 'defaults.virtualCluster', '')}
                onChange={
                  e=>{
                    setJobConfig((prevJobConfig, props) => {
                      const newJobConfig = _.cloneDeep(prevJobConfig.getObject())
                      _.set(newJobConfig, 'defaults.virtualCluster', e.target.value);
                      return new JobConfig(newJobConfig)
                    })
                  }
                }
                required
              />
            </Stack>
            <Stack gap={20} horizontal={true} horizontalAlign="end" className={styles.footer}>
              { transferring && <Spinner size={SpinnerSize.medium} />}
              <PrimaryButton
                disabled={transferring || (selectedCluster === '')}
                onClick={onClickTransfer}
                text="Confirm Transfer"
              />
              <DefaultButton
                disabled={transferring}
                text="Edit YAML"
              />
            </Stack>
          </Stack>
        </Stack>
      )}
    </div>
  );
};

ReactDOM.render(<JobTransferPage />, document.getElementById('content-wrapper'));
