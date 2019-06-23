import React, {useState} from 'react';
import PropTypes from 'prop-types';

import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';
import {SidebarCard} from '../sidebar/sidebar-card';
import {WebHDFSClient} from '../../utils/webhdfs';
import {HdfsContext} from '../../models/data/hdfs-context';

export const DataComponent = React.memo((props) => {
  const [dataList, setDataList] = useState([]);
  const [mountDirectories, setMountDirectories] = useState(null);
  const hdfsClient = new WebHDFSClient('10.151.40.234');

  return (
    <HdfsContext.Provider
      value={{user: '', api: '', token: '', hdfsClient}}
    >
      <SidebarCard
        title='Data'
        selected={props.selected}
        onSelect={props.onSelect}
      >
        <TeamStorage onChange={setMountDirectories} jobName={props.jobName} />
        <CustomStorage dataList={dataList} setDataList={setDataList} />
        <MountTreeView
          dataList={
            mountDirectories == null
              ? dataList
              : mountDirectories.getTeamDataList().concat(dataList)
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
};
