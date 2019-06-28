import React, {useCallback, useReducer, useEffect, useState} from 'react';
import PropTypes from 'prop-types';

import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';
import {SidebarCard} from '../sidebar/sidebar-card';
import {WebHDFSClient} from '../../utils/webhdfs';
import {HdfsContext} from '../../models/data/hdfs-context';
import {getHostNameFromUrl} from '../../utils/utils';
import {MountDirectories} from '../../models/data/mount-directories';
import {
  fetchUserGroup,
  fetchStorageConfigData,
  fetchStorageServer,
} from '../../utils/conn';
import config from '../../../config/webportal.config';

const host = getHostNameFromUrl(config.restServerUri);
import {JobData} from '../../models/data/job-data';

function reducer(state, action) {
  let jobData;
  switch (action.type) {
    case 'dataList':
      jobData = new JobData(
        state.hdfsClient,
        action.value,
        state.mountDirs,
        true,
      );
      action.onChange(jobData);
      return jobData;
    case 'mountDir':
      jobData = new JobData(
        state.hdfsClient,
        state.customDataList,
        action.value,
        true,
      );
      action.onChange(jobData);
      return jobData;
    default:
      throw new Error('Unrecognized type');
  }
}

export const DataComponent = React.memo((props) => {
  const hdfsClient = new WebHDFSClient(host);
  const {onChange} = props;
  const [teamConfigs, setTeamConfigs] = useState();
  const [defaultTeamConfigs, setDefaultTeamConfigs] = useState();
  const [jobData, dispatch] = useReducer(
    reducer,
    new JobData(hdfsClient, [], null),
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

  return (
    <HdfsContext.Provider value={{user: '', api: '', token: '', hdfsClient}}>
      <SidebarCard
        title='Data'
        selected={props.selected}
        onSelect={props.onSelect}
      >
        {teamConfigs && (
          <TeamStorage
            teamConfigs={teamConfigs}
            defaultTeamConfigs={defaultTeamConfigs}
            mountDirs={jobData.mountDirs}
            onMountDirChange={onMountDirChange}
          />
        )}
        <CustomStorage
          dataList={jobData.customDataList}
          setDataList={_onDataListChange}
        />
        <MountTreeView
          dataList={
            jobData.mountDirs == null
              ? jobData.customDataList
              : jobData.mountDirs
                  .getTeamDataList()
                  .concat(jobData.customDataList)
          }
        />
      </SidebarCard>
    </HdfsContext.Provider>
  );
});

DataComponent.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  jobName: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
