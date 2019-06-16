import React, {useState} from 'react';
import {Stack} from 'office-ui-fabric-react';
import {DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {FontClassNames} from '@uifabric/styling';
import c from 'classnames';

import t from '../../../../app/components/tachyons.scss';

export const TeamStorage = (Props) => {
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
    </div>
  );
};
