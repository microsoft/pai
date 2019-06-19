import React, {useState} from 'react';

import {BasicSection} from '../basic-section';
import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';

export const DataComponent = (Props) => {
  // const [dataCommand, setDataCommand] = useState([]);
  const [dataList, setDataList] = useState([]);
  const [teamDataList, setTeamDataList] = useState([]);

  return (
  <div style={{backgroundColor: 'white', padding: 10}}>
    <TeamStorage teamDataList={teamDataList} setTeamDataList={setTeamDataList}/>
    <CustomStorage dataList={dataList} setDataList={setDataList}/>
    <MountTreeView dataList={teamDataList.concat(dataList)} />
  </div>
  );
};
