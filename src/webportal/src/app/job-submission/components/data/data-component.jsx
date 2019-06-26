import React, {useCallback, useReducer, useEffect} from 'react';
import PropTypes from 'prop-types';

import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';
import {SidebarCard} from '../sidebar/sidebar-card';
import {WebHDFSClient} from '../../utils/webhdfs';
import {HdfsContext} from '../../models/data/hdfs-context';
import {TeamStorageClient} from '../../utils/team-storage-client';
import {getHostNameFromUrl} from '../../utils/utils';
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
  const api = config.restServerUri;
  const user = cookies.get('user');
  const token = cookies.get('token');
  const teamStorageClient = new TeamStorageClient(api, user, token);

  const {onChange} = props;
  const [jobData, dispatch] = useReducer(
    reducer,
    new JobData(hdfsClient, [], null),
  );

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
        <TeamStorage onChange={onMountDirChange} jobName={props.jobName} />
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
