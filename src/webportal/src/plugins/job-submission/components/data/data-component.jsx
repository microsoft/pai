import React, {useState} from 'react';

import {BasicSection} from '../BasicSection';
import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';

export const DataComponent = (Props) => {
  // const [dataCommand, setDataCommand] = useState([]);
  const [dataList, setDataList] = useState([]);

  return (
  <BasicSection sectionLabel='Data' sectionOptional>
    <TeamStorage dataList={dataList} setDataList={setDataList}/>
    <CustomStorage dataList={dataList} setDataList={setDataList}/>
  </BasicSection>
  );
};
