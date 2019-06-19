import React, {useState} from 'react';
import PropTypes from 'prop-types';

import {TeamStorage} from './team-storage';
import {CustomStorage} from './custom-storage';
import {MountTreeView} from './mount-tree-view';
import {SidebarCard} from '../sidebar/sidebar-card';

export const DataComponent = React.memo((props) => {
  // const [dataCommand, setDataCommand] = useState([]);
  const [dataList, setDataList] = useState([]);
  const [teamDataList, setTeamDataList] = useState([]);

  return (
    <SidebarCard
      title='Data'
      selected={props.selected}
      onSelect={props.onSelect}
    >
    <TeamStorage teamDataList={teamDataList} setTeamDataList={setTeamDataList}/>
    <CustomStorage dataList={dataList} setDataList={setDataList}/>
    <MountTreeView dataList={teamDataList.concat(dataList)} />
  </SidebarCard>
  );
});

DataComponent.propTypes = {
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};
