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
import { BasicSection } from '../../../job-submission/components/basic-section';
import { FormShortSection } from '../../../job-submission/components/form-page';

import { SpinnerLoading } from '../../../components/loading';

import _ from 'lodash';
import InfoBox from './job-transfer/info-box';
import { fetchBoundedClusters, fetchJobConfig } from './job-transfer/conn';

const params = new URLSearchParams(window.location.search);
// the user who is viewing this page
const userName = cookies.get('user');
// the user of the job
const jobUserName = params.get('userName');
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

const JobTransferPage = () => {
  const [loading, setLoading] = useState(true);
  const [boundedClusters, setBoundedClusters] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [jobConfig, setJobConfig] = useState({});
  const [transferring, setTransferring] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [infoBoxProps, setInfoBoxProps] = useState({});

  const onDismissInfoBox = () => {
    setShowInfoBox(false);
    setInfoBoxProps({});
  }

  const fetchInfo = async () => {
    const [boundedClustersInfo, jobConfigInfo] = await Promise.all([fetchBoundedClusters(userName), fetchJobConfig(jobUserName, jobName)]);
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
    setJobConfig(jobConfigInfo);
    setLoading(false);
  };
  useEffect(() => {
    fetchInfo().catch((e)=>{
      setShowInfoBox(true);
      setInfoBoxProps({
        title: 'Error',
        message: e.message,
        onDismiss: onDismissInfoBox,
      });
  })}, []);


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
                value={_.get(jobConfig, 'name', '')}
                onChange={e=> {
                  setJobConfig((prevJobConfig, props) => {
                    const newJobConfig = _.cloneDeep(prevJobConfig)
                    _.set(newJobConfig, 'name', e.target.value);
                    return newJobConfig
                  })
                }}
                required
               />
            </Stack>
            <Stack className={styles.item}>
              <TextField
                label="VC Name"
                value={_.get(jobConfig, 'defaults.virtualCluster', '')}
                onChange={
                  e=>{
                    setJobConfig((prevJobConfig, props) => {
                      const newJobConfig = _.cloneDeep(prevJobConfig)
                      _.set(newJobConfig, 'defaults.virtualCluster', e.target.value);
                      return newJobConfig
                    })
                  }
                }
                required
              />
            </Stack>
            <Stack gap={20} horizontal={true} horizontalAlign="end" className={styles.footer}>
              { transferring && <Spinner size={SpinnerSize.medium} />}
              <PrimaryButton
                disabled={transferring}
                onClick={()=> {
                  setTransferring(true);
                  setTimeout(()=>{setTransferring(false)}, 2000)
                }}
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
