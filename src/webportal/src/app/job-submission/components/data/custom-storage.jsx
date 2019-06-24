import React from 'react';
import PropTypes from 'prop-types';

import {AddDataSource} from './add-data-source';
import {MountList} from './mount-list';
import {InputData} from '../../models/data/input-data';

export const CustomStorage = ({dataList, setDataList}) => {
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
