import React from 'react';
import PropTypes from 'prop-types';
import {FontClassNames, FontWeights} from 'office-ui-fabric-react';
import c from 'classnames';

import {AddDataSource} from './add-data-source';
import {MountList} from './custom-mount-list';
import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

export const CustomStorage = ({dataList, setDataList}) => {
  return (
    <div>
      <div
        className={c(FontClassNames.mediumPlus, t.pv3)}
        style={{fontWeight: FontWeights.semibold}}
      >
        Customized Storage
      </div>
      <div>
        <AddDataSource dataList={dataList} setDataList={setDataList} />
        <MountList dataList={dataList} setDataList={setDataList} />
      </div>
    </div>
  );
};

CustomStorage.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
};
