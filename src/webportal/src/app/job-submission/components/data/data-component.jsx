import React, {useState} from 'react';

import {BasicSection} from '../basic-section';
import {MountDirectories, TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';
import {JobInformation} from '../job-information';

export const DataComponent = (props) => {
  // const [dataCommand, setDataCommand] = useState([]);
  const {jobInformation} = props;
  const [dataList, setDataList] = useState([]);
  const [mountDirectories, setMountDirectories] = useState(null);

  return (
  <div style={{backgroundColor: 'white', padding: 10}}>
    <TeamStorage onChange={setMountDirectories} jobName={jobInformation.name}/>
    <CustomStorage dataList={dataList} setDataList={setDataList}/>
    <MountTreeView dataList={mountDirectories == null ? dataList : mountDirectories.getTeamDataList().concat(dataList)} />
  </div>
  );
};
