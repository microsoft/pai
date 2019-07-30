import React, {useCallback, useReducer, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Stack} from 'office-ui-fabric-react';

import {TeamStorage} from './team-storage';
import {ImportAtt} from './import-att';
import {CustomMount} from './custom-mount';
import {MountTreeView} from './mount-tree-view';
import {SidebarCard} from '../sidebar/sidebar-card';
import {WebHDFSClient} from '../../utils/webhdfs';
import {HdfsContext} from '../../models/data/hdfs-context';
import {getHostNameFromUrl, getPortFromUrl} from '../../utils/utils';
import {MountDirectories} from '../../models/data/mount-directories';
import {
  fetchUserGroup,
  fetchStorageConfigData,
  fetchStorageServer,
} from '../../utils/conn';
import config from '../../../config/webportal.config';
import {JobData} from '../../models/data/job-data';
import {Hint} from '../sidebar/hint';
import {PROTOCOL_TOOLTIPS} from '../../utils/constants';

function reducer(state, action) {
  let jobData;
  switch (action.type) {
    case 'dataList':
      jobData = new JobData(
        state.hdfsClient,
        action.value,
        state.mountDirs,
        true,
        state.customMountList,
      );
      action.onChange(jobData);
      return jobData;
    case 'mountDir':
      jobData = new JobData(
        state.hdfsClient,
        state.customDataList,
        action.value,
        true,
        state.customMountList,
      );
      action.onChange(jobData);
      return jobData;
    case 'mountList':
      jobData = new JobData(
        state.hdfsClient,
        state.customDataList,
        state.mountDirs,
        true,
        action.value,
      );
      action.onChange(jobData);
      return jobData;
    default:
      throw new Error('Unrecognized type');
  }
}

export const DataComponent = React.memo((props) => {
  const envsubRegex = /^\${.*}$/; // the template string ${xx} will be reserved in envsub if not provide value
  let hdfsHost;
  let port;
  let apiPath;
  if (!config.webHDFSUri || envsubRegex.test(config.webHDFSUri)) {
    hdfsHost = window.location.hostname;
  } else {
    // add WEBHDFS_URI to .env for local debug
    hdfsHost = getHostNameFromUrl(config.webHDFSUri);
    port = getPortFromUrl(config.webHDFSUri);
  }
  const hdfsClient = new WebHDFSClient(hdfsHost, undefined, undefined, port, apiPath);
  const {onChange, customMountFlag, setCustomMountFlag} = props;
  const [teamConfigs, setTeamConfigs] = useState();
  const [defaultTeamConfigs, setDefaultTeamConfigs] = useState();
  const [attError, setAttError] = useState({
    customContainerPathError: false,
    customDataSourceError: false,
  });
  const [mountError, setMountError] = useState({
    customContainerPathError: false,
    customDataSourceError: false,
  });
  const [jobData, dispatch] = useReducer(
    reducer,
    new JobData(hdfsClient, [], null, true, []),
  );

  useEffect(() => {
    const api = config.restServerUri;
    const user = cookies.get('user');
    const token = cookies.get('token');
    const userGroupPromise = fetchUserGroup(api, user, token);
    const configPromise = fetchStorageConfigData(api);
    const serverPromise = fetchStorageServer(api);
    Promise.all([userGroupPromise, configPromise, serverPromise])
      .then(([userGroups, storageConfigData, storageServerData]) => {
        const newConfigs = [];
        const serverNames = [];
        const defaultConfigs = [];
        const servers = [];
        for (const confName of Object.keys(storageConfigData)) {
          const config = JSON.parse(atob(storageConfigData[confName]));
          for (const gpn of userGroups) {
            if (config.gpn !== gpn) {
              continue;
            } else {
              newConfigs.push(config);
              if (config.servers !== undefined) {
                for (const serverName of config.servers) {
                  if (serverNames.indexOf(serverName) === -1) {
                    serverNames.push(serverName);
                  }
                }
              }
              // Auto select default mounted configs
              if (config.default === true) {
                defaultConfigs.push(config);
              }
            }
          }
        }
        for (const serverName of serverNames) {
          if (serverName in storageServerData) {
            const serverContent = JSON.parse(
              atob(storageServerData[serverName]),
            );
            servers.push(serverContent);
          }
        }
        const mountDirectories = new MountDirectories(
          user,
          props.jobName,
          defaultConfigs,
          servers,
        );
        setTeamConfigs(newConfigs);
        setDefaultTeamConfigs(defaultConfigs);
        onMountDirChange(mountDirectories);
      })
      .catch((e) => {
        setDefaultTeamConfigs(null);
        setTeamConfigs(null);
      });
  }, []);

  const _onDataListChange = useCallback(
    (dataList) => {
      dispatch({type: 'dataList', value: dataList, onChange: onChange});
    },
    [onChange],
  );

  const onMountDirChange = useCallback(
    (mountDir) => {
      dispatch({type: 'mountDir', value: mountDir, onChange: onChange});
    },
    [onChange],
  );

  const onMountListChange = useCallback(
    (mountList) => {
      dispatch({type: 'mountList', value: mountList, onChange: onChange});
    },
    [onChange],
  );

  return (
    <HdfsContext.Provider value={{user: '', api: '', token: '', hdfsClient}}>
      <SidebarCard
        title='Data'
        tooltip={PROTOCOL_TOOLTIPS.data}
        selected={props.selected}
        onSelect={props.onSelect}
        error={
          attError.customContainerPathError ||
          attError.customDataSourceError ||
          mountError.customContainerPathError ||
          mountError.customDataSourceError
        }
      >
        <Stack gap='m'>
          <Hint>
            The data configured here will be mounted or copied into job
            container. You could use them with <code>{'Container Path'}</code>{' '}
            value below.
          </Hint>
          {teamConfigs && (
            <TeamStorage
              teamConfigs={teamConfigs}
              defaultTeamConfigs={defaultTeamConfigs}
              mountDirs={jobData.mountDirs}
              onMountDirChange={onMountDirChange}
            />
          )}
          <CustomMount
            mountList={jobData.customMountList}
            setMountList={onMountListChange}
            customMountFlag={customMountFlag}
            setCustomMountFlag={setCustomMountFlag}
            setDataError={setMountError}
          />
          <ImportAtt
            dataList={jobData.customDataList}
            setDataList={_onDataListChange}
            setDataError={setAttError}
          />
          <MountTreeView
            dataList={
              jobData.mountDirs == null
                ? jobData.customDataList.concat(jobData.customMountList)
                : jobData.mountDirs
                  .getTeamDataList()
                  .concat(jobData.customDataList.concat(jobData.customMountList))
            }
          />
        </Stack>
      </SidebarCard>
    </HdfsContext.Provider>
  );
});

DataComponent.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  jobName: PropTypes.string,
  customMountFlag: PropTypes.bool,
  setCustomMountFlag: PropTypes.func,
  onChange: PropTypes.func.isRequired,
};
