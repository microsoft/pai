import React, { useCallback, useReducer, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Stack } from 'office-ui-fabric-react';

import { TeamStorage } from './team-storage';
import { CustomStorage } from './custom-storage';
import { MountTreeView } from './mount-tree-view';
import { SidebarCard } from '../sidebar/sidebar-card';
import { WebHDFSClient } from '../../utils/webhdfs';
import { HdfsContext } from '../../models/data/hdfs-context';
import { getHostNameFromUrl, getPortFromUrl } from '../../utils/utils';
import { MountDirectories } from '../../models/data/mount-directories';
import {
  listUserStorageConfigs,
  fetchStorageConfigs,
  fetchStorageServers,
} from '../../utils/conn';
import config from '../../../config/webportal.config';
import { JobData } from '../../models/data/job-data';
import { Hint } from '../sidebar/hint';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';

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

export const DataComponent = React.memo(props => {
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
  const hdfsClient = new WebHDFSClient(
    hdfsHost,
    undefined,
    undefined,
    port,
    apiPath,
  );
  const { onChange } = props;
  const [teamConfigs, setTeamConfigs] = useState();
  const [defaultTeamConfigs, setDefaultTeamConfigs] = useState();
  const [dataError, setDataError] = useState({
    customContainerPathError: false,
    customDataSourceError: false,
  });
  const [jobData, dispatch] = useReducer(
    reducer,
    new JobData(hdfsClient, [], null),
  );

  useEffect(() => {
    const user = cookies.get('user');

    listUserStorageConfigs(user)
      .then(configNames => {
        fetchStorageConfigs(configNames).then(configs => {
          const defaultConfigs = [];
          let serverNames = new Set();

          for (const config of configs) {
            if (config.mountInfos === undefined) continue;

            if (config.default === true) {
              defaultConfigs.push(config);
            }
            for (const mountInfo of config.mountInfos) {
              serverNames = new Set([...serverNames, mountInfo.server]);
            }
          }

          fetchStorageServers([...serverNames]).then(rawServers => {
            const servers = [];
            for (const rawServer of rawServers) {
              servers.push(rawServer.data);
            }

            const mountDirectories = new MountDirectories(
              user,
              props.jobName,
              defaultConfigs,
              servers,
            );

            setTeamConfigs(configs);
            setDefaultTeamConfigs(defaultConfigs);
            onMountDirChange(mountDirectories);
          });
        });
      })
      .catch(e => {
        setDefaultTeamConfigs(null);
        setTeamConfigs(null);
      });
  }, []);

  const _onDataListChange = useCallback(
    dataList => {
      dispatch({ type: 'dataList', value: dataList, onChange: onChange });
    },
    [onChange],
  );

  const onMountDirChange = useCallback(
    mountDir => {
      dispatch({ type: 'mountDir', value: mountDir, onChange: onChange });
    },
    [onChange],
  );

  return (
    <HdfsContext.Provider value={{ user: '', api: '', token: '', hdfsClient }}>
      <SidebarCard
        title='Data'
        tooltip={PROTOCOL_TOOLTIPS.data}
        selected={props.selected}
        onSelect={props.onSelect}
        error={
          dataError.customContainerPathError || dataError.customDataSourceError
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
          <CustomStorage
            dataList={jobData.customDataList}
            setDataList={_onDataListChange}
            setDataError={setDataError}
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
        </Stack>
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
