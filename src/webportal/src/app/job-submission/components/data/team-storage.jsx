import React, {useState} from 'react';
import {Stack} from 'office-ui-fabric-react';
import {DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {FontClassNames, FontWeights} from '@uifabric/styling';
import {cloneDeep} from 'lodash';
import c from 'classnames';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import {
  SMB_CONFIG,
  NFS_CONFIG,
  DFNFS_CONFIG,
} from '../../models/data/team-data-list';
import {TeamMountList} from './team-mount-list';
import t from '../../../../app/components/tachyons.scss';

export const TeamStorage = ({teamDataList, setTeamDataList}) => {
  const [nfsEnable, setNfsEnable] = useState(false);
  const [dfnfsEnable, setDfnfsEnable] = useState(false);
  const [smbEnable, setSmbEnable] = useState(false);

  return (
    <div>
      <div className={c(FontClassNames.mediumPlus, t.pb2)} style={{fontWeight: FontWeights.semibold}}>Team Share Storage</div>
      <Stack horizontal disableShrink gap='s1'>
        <DefaultButton
          text='dfnfs'
          toggle={true}
          checked={dfnfsEnable}
          onClick={() => {
            let newTeamDataList;
            if (dfnfsEnable === false) {
              newTeamDataList = cloneDeep(teamDataList);
              for (const source of DFNFS_CONFIG) {
                newTeamDataList.push(new InputData(source[0], source[1], 'dfnfs'));
              }
            } else {
              newTeamDataList = teamDataList.filter((element) => {
                return element.sourceType !== 'dfnfs';
              });
            }
            setTeamDataList(newTeamDataList);
            setDfnfsEnable(!dfnfsEnable);
          }}
        />
        <DefaultButton
          text='nfs'
          toggle={true}
          checked={nfsEnable}
          onClick={() => {
            let newTeamDataList;
            if (nfsEnable === false) {
              newTeamDataList = cloneDeep(teamDataList);
              for (const source of NFS_CONFIG) {
                newTeamDataList.push(new InputData(source[0], source[1], 'nfs'));
              }
            } else {
              newTeamDataList = teamDataList.filter((element) => {
                return element.sourceType !== 'nfs';
              });
            }
            setTeamDataList(newTeamDataList);
            setNfsEnable(!nfsEnable);
          }}
        />
        <DefaultButton
          text='smb'
          toggle={true}
          checked={smbEnable}
          onClick={() => {
            setSmbEnable(!smbEnable);
          }}
        />
      </Stack>
      <TeamMountList dataList={teamDataList} setDataList={setTeamDataList} />
    </div>
  );
};

TeamStorage.propTypes = {
  teamDataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setTeamDataList: PropTypes.func,
};
