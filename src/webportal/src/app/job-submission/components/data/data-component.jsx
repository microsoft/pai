import React, {
  useCallback,
  useReducer,
  useEffect,
  useState,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { Stack } from 'office-ui-fabric-react';
import { isNil, isEmpty, get, isEqual } from 'lodash';

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
      if (config.launcherType === 'k8s') {
        const plugins = get(action, ['extras', PAI_PLUGIN], []);
        const updatedRuntimePlugins = generateUpdatedRuntimePlugins(
          action.value.selectedConfigs,
          plugins,
        );
        if (!isEqual(plugins, updatedRuntimePlugins)) {
          const updatedExtras = {
            ...action.extras,
            [PAI_PLUGIN]: updatedRuntimePlugins,
          };
          action.onExtrasChange(updatedExtras);
        }
      }
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
  const { onChange, extras, onExtrasChange } = props;
  const [teamConfigs, setTeamConfigs] = useState();
  const [teamServers, setTeamServers] = useState();
  const [dataError, setDataError] = useState({
    customContainerPathError: false,
    customDataSourceError: false,
  });
  const [jobData, dispatch] = useReducer(
    reducer,
    new JobData(hdfsClient, [], null),
  );

  const storageConfigs = useMemo(() => {
    const storagePlugin = getStoragePlugin(extras);
    if (isEmpty(storagePlugin)) {
      return [];
    }
    const storageConfigNames = get(
      storagePlugin,
      'parameters.storageConfigNames',
      [],
    );
    return storageConfigNames;
  }, [extras]);

  const selectedTeamConfigs = useMemo(() => {
    if (isEmpty(teamConfigs) || isEmpty(storageConfigs)) {
      return [];
    }
    return teamConfigs.filter(
      config => storageConfigs.indexOf(config.name) > -1,
    );
  }, [storageConfigs, teamConfigs]);

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
            serverNames = new Set([...serverNames, mountInfo.server]);
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
        setTeamServers(storageServers);
        setTeamConfigs(storageConfigs);
      } catch {}
    };
    initialize();
  }, []);

  useEffect(() => {
    // Not initialized
    if (isNil(teamConfigs)) return;

    const user = cookies.get('user');
    const mountDirectories = new MountDirectories(
      user,
      props.jobName,
      selectedTeamConfigs,
      teamServers,
    );

    onMountDirChange(mountDirectories);
  }, [selectedTeamConfigs, teamConfigs]);

  const _onDataListChange = useCallback(
    dataList => {
      dispatch({ type: 'dataList', value: dataList, onChange: onChange });
    },
    [onChange],
  );

  const onMountDirChange = useCallback(
    mountDir => {
      dispatch({
        type: 'mountDir',
        value: mountDir,
        onChange: onChange,
        extras: extras,
        onExtrasChange: onExtrasChange,
      });
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
          {teamConfigs && (
            <TeamStorage
              teamConfigs={teamConfigs}
              defaultTeamConfigs={selectedTeamConfigs}
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
  extras: PropTypes.object,
  onExtrasChange: PropTypes.func.isRequired,
};
