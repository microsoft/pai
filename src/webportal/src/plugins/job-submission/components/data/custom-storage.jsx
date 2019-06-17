import React from 'react';
import {FontClassNames} from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';

import {AddDataSource} from './add-data-source';
import {MountList} from './mount-list';
import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

export const CustomStorage = (props) => {
  const {dataList, setDataList} = props;

  return (
    <div>
      <AddDataSource dataList={dataList} setDataList={setDataList} />
      <MountList dataList={dataList} setDataList={setDataList} />
    </div>
  );
};

CustomStorage.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
};
