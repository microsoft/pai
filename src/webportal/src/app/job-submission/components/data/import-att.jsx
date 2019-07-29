import React from 'react';
import PropTypes from 'prop-types';
import {FontClassNames, FontWeights, getTheme} from 'office-ui-fabric-react';
import c from 'classnames';

import {AddAttSource} from './add-att-source';
import {CustomDataList} from './custom-data-list';
import {InputData} from '../../models/data/input-data';
import {STORAGE_PREFIX} from '../../utils/constants';

const {spacing} = getTheme();
export const ImportAtt = ({dataList, setDataList, setDataError}) => {
  return (
    <div>
      <div
        className={c(FontClassNames.mediumPlus)}
        style={{fontWeight: FontWeights.semibold, paddingBottom: spacing.m}}
      >
        Attachment
      </div>
      <div>
        <AddAttSource
          dataList={dataList}
          setDataList={setDataList}
        />
        <CustomDataList
          dataList={dataList}
          setDataList={setDataList}
          setDataError={setDataError}
          prefix={STORAGE_PREFIX}
        />
      </div>
    </div>
  );
};

ImportAtt.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataError: PropTypes.func,
};
