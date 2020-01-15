import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Stack } from 'office-ui-fabric-react';
import { isEmpty, get, isEqual } from 'lodash';

import { TeamStorage } from './team-storage';
import { CustomStorage } from './custom-storage';
import { MountTreeView } from './mount-tree-view';
import { SidebarCard } from '../sidebar/sidebar-card';
import { WebHDFSClient } from '../../utils/webhdfs';
import { HdfsContext } from '../../models/data/hdfs-context';
import {
  getHostNameFromUrl,
  getPortFromUrl,
  getStoragePlugin,
} from '../../utils/utils';
import { MountDirectories } from '../../models/data/mount-directories';
import {
  listUserStorageConfigs,
  fetchStorageConfigs,
  fetchStorageServers,
} from '../../utils/conn';
import config from '../../../config/webportal.config';
import { JobData } from '../../models/data/job-data';
import { Hint } from '../sidebar/hint';
import {
  PROTOCOL_TOOLTIPS,
  PAI_PLUGIN,
  STORAGE_PLUGIN,
} from '../../utils/constants';

const generateUpdatedRuntimePlugins = (storageConfigs, oriPlugins) => {
  const updatedPlugins = oriPlugins.filter(
    plugin => plugin.plugin !== STORAGE_PLUGIN,
  );

  if (!isEmpty(storageConfigs)) {
    const storagePlugin = {
      plugin: STORAGE_PLUGIN,
      parameters: {
        storageConfigNames: storageConfigs.map(config => config.name),
      },
    };
    updatedPlugins.push(storagePlugin);
  }
  return updatedPlugins;
};

const getStorageConfigNamesFromExtras = (extras, teamStorageConfigs) => {
  const storagePlugin = getStoragePlugin(extras);
  if (isEmpty(storagePlugin)) {
    return [];
  }

  let defaultTeamStorageConfigName;
  if (!isEmpty(teamStorageConfigs)) {
    const defaultConfig = teamStorageConfigs.find(
      config => config.default === true,
    );
    if (!isEmpty(defaultConfig)) {
      defaultTeamStorageConfigName = defaultConfig.name;
    }
  }

  // If set storage plugin but config is empty, use default config
  const storageConfigNames = get(
    storagePlugin,
    'parameters.storageConfigNames',
    isEmpty(defaultTeamStorageConfigName) ? [] : [defaultTeamStorageConfigName],
  );
  return storageConfigNames;
};

const getValidStorageConfigs = (extras, teamStorageConfigs) => {
  const storageConfigNames = getStorageConfigNamesFromExtras(
    extras,
    teamStorageConfigs,
  );

  const validStorageConfigs = teamStorageConfigs.filter(
    config => storageConfigNames.indexOf(config.name) > -1,
  );
  if (storageConfigNames.length !== validStorageConfigs.length) {
    alert('Some storage configs is invalid, please check');
  }
  return validStorageConfigs;
};

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
  const { onChange, extras, onExtrasChange } = props;
  const [teamStorageConfig, setTeamStorageConfig] = useState({});
  const [jobData, setJobData] = useState(new JobData(hdfsClient, [], null));
  const [dataError, setDataError] = useState({
    customContainerPathError: false,
    customDataSourceError: false,
  });

  useEffect(() => {
    const user = cookies.get('user');

    const initialize = async () => {
      try {
        const userConfigNames = await listUserStorageConfigs(user);
        const storageConfigs = await fetchStorageConfigs(userConfigNames);
        let serverNames = new Set();
        for (const config of storageConfigs) {
          if (config.mountInfos === undefined) continue;
          for (const mountInfo of config.mountInfos) {
            serverNames = serverNames.add(mountInfo.server);
          }
        }

        const rawStorageServers = await fetchStorageServers([...serverNames]);
        const storageServers = [];
        for (const rawServer of rawStorageServers) {
          const server = {
            spn: rawServer.spn,
            type: rawServer.type,
            ...rawServer.data,
            extension: rawServer.extension,
          };
          storageServers.push(server);
        }
        setTeamStorageConfig({
          storageServers: storageServers,
          storageConfigs: storageConfigs,
        });
      } catch {}
    };
    initialize();
  }, []);

  useEffect(() => {
    // Not initialized
    if (isEmpty(teamStorageConfig)) return;

    const selectedTeamStorageConfigs = getValidStorageConfigs(
      extras,
      teamStorageConfig.storageConfigs,
    );

    const user = cookies.get('user');
    const mountDirectories = new MountDirectories(
      user,
      props.jobName,
      selectedTeamStorageConfigs,
      teamStorageConfig.storageServers,
    );

    setJobData(jobData => {
      const updatedJobData = new JobData(
        jobData.hdfsClient,
        jobData.customDataList,
        mountDirectories,
        true,
      );
      onChange(updatedJobData);
      return updatedJobData;
    });
  }, [extras, teamStorageConfig, onChange]);

  const onDataListChange = useCallback(
    dataList => {
      setJobData(jobData => {
        const updatedJobData = new JobData(
          jobData.hdfsClient,
          dataList,
          jobData.mountDirs,
          true,
        );
        onChange(updatedJobData);
        return updatedJobData;
      });
    },
    [onChange],
  );

  const onMountDirChange = useCallback(
    // Will only update extra field, jobData will be updated by useEffect function
    mountDir => {
      const plugins = get(extras, [PAI_PLUGIN], []);
      const updatedRuntimePlugins = generateUpdatedRuntimePlugins(
        mountDir.selectedConfigs,
        plugins,
      );
      if (!isEqual(updatedRuntimePlugins, plugins)) {
        const updatedExtras = {
          ...extras,
          [PAI_PLUGIN]: updatedRuntimePlugins,
        };
        onExtrasChange(updatedExtras);
      }
    },
    [onChange, onExtrasChange, extras],
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
          {!isEmpty(teamStorageConfig) && (
            <TeamStorage
              teamStorageConfigs={teamStorageConfig.storageConfigs}
              mountDirs={jobData.mountDirs}
              onMountDirChange={onMountDirChange}
            />
          )}
          {config.launcherType !== 'k8s' && (
            <CustomStorage
              dataList={jobData.customDataList}
              setDataList={onDataListChange}
              setDataError={setDataError}
            />
          )}
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
  extras: PropTypes.object,
  onExtrasChange: PropTypes.func.isRequired,
};
