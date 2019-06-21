import React, {useState} from 'react';
import PropTypes from 'prop-types';

import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';
import {SidebarCard} from '../sidebar/sidebar-card';

export const DataComponent = React.memo((props) => {
  // const [dataCommand, setDataCommand] = useState([]);
  const [dataList, setDataList] = useState([]);
  const [mountDirectories, setMountDirectories] = useState(null);

  return (
    <SidebarCard
      title='Data'
      selected={props.selected}
      onSelect={props.onSelect}
    >
      <TeamStorage onChange={setMountDirectories} jobName={props.jobName}/>
      <CustomStorage dataList={dataList} setDataList={setDataList}/>
      <MountTreeView dataList={mountDirectories == null ? dataList : mountDirectories.getTeamDataList().concat(dataList)} />
    </SidebarCard>
  );
});

DataComponent.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  jobName: PropTypes.string,
};
