import React, {useState} from 'react';
import {Stack} from 'office-ui-fabric-react';
import {DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {FontClassNames} from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import {MountList} from './mount-list';
import t from '../../../../app/components/tachyons.scss';

export const TeamStorage = ({dataList, setDataList}) => {
  const [nfsEnable, setNfsEnable] = useState(false);
  const [hdfsEnable, setHdfsEnable] = useState(false);

  return (
    <div>
      <div className={c(FontClassNames.large, t.pb1)}>
        Team Storage
      </div>
      <Stack horizontal disableShrink gap='s1'>
        <DefaultButton
          text='dfnfs'
          toggle={true}
          checked={nfsEnable}
          onClick={() => {
            setNfsEnable(!nfsEnable);
          }}
        />
        <DefaultButton
          text='hdfs'
          toggle={true}
          checked={hdfsEnable}
          onClick={() => {
            setHdfsEnable(!hdfsEnable);
          }}
        />
      </Stack>
      <MountList dataList={dataList} setDataList={setDataList} />
    </div>
  );
};

TeamStorage.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
};
