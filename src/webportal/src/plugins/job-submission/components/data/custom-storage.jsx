import React from 'react';
import {FontClassNames} from '@uifabric/styling';
import c from 'classnames';
import PropTypes from 'prop-types';

import {AddDataSource} from './addDataSource';
import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

export const CustomStorage = (props) => {
  const {dataList, setDataList} = props;

  return (
    <div>
      <div className={c(FontClassNames.large, t.pb1)}>
        Custom Storage
      </div>
      <AddDataSource dataList={dataList} setDataList={setDataList} />
    </div>
  );
};

CustomStorage.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
};
