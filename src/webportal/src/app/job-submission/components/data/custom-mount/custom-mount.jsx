import React from 'react';
import PropTypes from 'prop-types';
import {FontClassNames, FontWeights, getTheme} from 'office-ui-fabric-react';
import c from 'classnames';
import {MOUNT_PREFIX} from '../../../utils/constants';
import {AddMount} from './add-mount';
import {MountList} from '../custom-mount-list';
import {InputData} from '../../../models/data/input-data';

const {spacing} = getTheme();
export const CustomMount = ({mountList, setMountList, setDataError}) => {
  return (
    <div>
      <div
        className={c(FontClassNames.mediumPlus)}
        style={{fontWeight: FontWeights.semibold, paddingBottom: spacing.m}}
      >
        Customized mount
      </div>
      <div>
        <AddMount
          mountList={mountList}
          setMountList={setMountList}
        />
        <MountList
          dataList={mountList}
          setDataList={setMountList}
          setDataError={setDataError}
          prefix={MOUNT_PREFIX}
        />
      </div>
    </div>
  );
};

CustomMount.propTypes = {
  mountList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setMountList: PropTypes.func,
  setDataError: PropTypes.func,
};
