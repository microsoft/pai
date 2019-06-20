import React, {useState} from 'react';
import PropTypes from 'prop-types';

import {MountDirectories, TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';
import {SidebarCard} from '../sidebar/sidebar-card';
import {JobInformation} from '../job-information';

export const DataComponent = React.memo((props) => {
  // const [dataCommand, setDataCommand] = useState([]);
  const {selected, onSelect, jobInformation} = props;
  const [dataList, setDataList] = useState([]);
  const [mountDirectories, setMountDirectories] = useState(null);

  return (
    <SidebarCard
      title='Data'
      selected={props.selected}
      onSelect={props.onSelect}
    >
      <TeamStorage onChange={setMountDirectories} jobName={jobInformation.name}/>
      <CustomStorage dataList={dataList} setDataList={setDataList}/>
      <MountTreeView dataList={mountDirectories == null ? dataList : mountDirectories.getTeamDataList().concat(dataList)} />
    </SidebarCard>
  );
});

DataComponent.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  jobInformation: PropTypes.instanceOf(JobInformation),
};
