import React from 'react';
import PropTypes from 'prop-types';
import { FontClassNames, FontWeights, getTheme } from 'office-ui-fabric-react';
import c from 'classnames';

import { AddDataSource } from './add-data-source';
import { MountList } from './custom-mount-list';
import { InputData } from '../../models/data/input-data';

const { spacing } = getTheme();
export const CustomStorage = ({ dataList, setDataList, setDataError }) => {
  return (
    <div>
      <div
        className={c(FontClassNames.mediumPlus)}
        style={{ fontWeight: FontWeights.semibold, paddingBottom: spacing.m }}
      >
        Customized storage
      </div>
      <div>
        <AddDataSource dataList={dataList} setDataList={setDataList} />
        <MountList
          dataList={dataList}
          setDataList={setDataList}
          setDataError={setDataError}
        />
      </div>
    </div>
  );
};

CustomStorage.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataError: PropTypes.func,
};
