import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {FontClassNames, FontWeights, getTheme, Toggle} from 'office-ui-fabric-react';
import c from 'classnames';
import {MOUNT_PREFIX} from '../../utils/constants';
import {AddMountSource} from './add-mount-source';
import {CustomDataList} from './custom-data-list';
import {InputData} from '../../models/data/input-data';

const {spacing} = getTheme();
export const CustomMount = ({mountList, setMountList, setDataError}) => {
  const [customMountFlag, setCustomMountFlag] = useState(false);
  return (
    <div>
      <Toggle
        label={
          <div
            className={c(FontClassNames.mediumPlus)}
            style={{fontWeight: FontWeights.semibold}}
          >
            Customized mount
          </div>
        }
        inlineLabel={true}
        styles={{
          label: {order: -1, marginLeft: 0, marginRight: spacing.s1},
        }}
        checked={customMountFlag}
        onChange={(ev, isChecked) => {
          setCustomMountFlag(isChecked);
        }}
      />
      {customMountFlag && (
        <div>
          <AddMountSource
            mountList={mountList}
            setMountList={setMountList}
          />
          <CustomDataList
            dataList={mountList}
            setDataList={setMountList}
            setDataError={setDataError}
            prefix={MOUNT_PREFIX}
          />
        </div>
      )}
    </div>
  );
};

CustomMount.propTypes = {
  mountList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setMountList: PropTypes.func,
  setDataError: PropTypes.func,
};
