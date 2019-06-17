import React, {useState} from 'react';

import {BasicSection} from '../BasicSection';
import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';

export const DataComponent = (Props) => {
  // const [dataCommand, setDataCommand] = useState([]);
  const [dataList, setDataList] = useState([]);
  const [teamDataList, setTeamDataList] = useState([]);

  return (
  <BasicSection sectionLabel='Data' sectionOptional>
    <TeamStorage teamDataList={teamDataList} setTeamDataList={setTeamDataList}/>
    <CustomStorage dataList={dataList} setDataList={setDataList}/>
    <MountTreeView dataList={teamDataList.concat(dataList)} />
  </BasicSection>
  );
};
