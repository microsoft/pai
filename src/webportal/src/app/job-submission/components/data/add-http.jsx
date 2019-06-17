import React, {useState} from 'react';
import c from 'classnames';
import {PrimaryButton, DefaultButton} from 'office-ui-fabric-react/lib/Button';
import {TextField} from 'office-ui-fabric-react/lib/TextField';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

const STORAGE_PREFIX = '/test';

export const AddHttp = (props) => {
  const {dataList, setDataList, setDataType} = props;
  const [mountPath, setMountPath] = useState();
  const [httpUrl, setHttpUrl] = useState();
  const submitMount = () => {
    const newMountList = cloneDeep(dataList);
    newMountList.push(new InputData(mountPath, httpUrl, 'http'));
    setDataList(newMountList);
    setDataType('none');
  };
  return (
    <div>
      <div className={c(t.flex, t.itemsEnd, t.justifyBetween)}>
        <TextField
          required={true} // eslint-disable-line react/jsx-boolean-value
          prefix={STORAGE_PREFIX}
          label='The path in container'
          className={c(t.w30, t.mr3)}
          onChange={(_event, newValue) => {
            setMountPath(`${STORAGE_PREFIX}${newValue}`);
          }}
        />
        <TextField
          required={true} // eslint-disable-line react/jsx-boolean-value
          label='The http address'
          className={c(t.w30, t.mr3)}
          onChange={(_event, newValue) => {
            setHttpUrl(newValue);
          }}
        />
        <div>
          <DefaultButton
            text='submit'
            className={c(t.mr2)}
            onClick={submitMount}
          />
          <DefaultButton
            text='cancel'
            onClick={() => {
              setDataType('none');
            }}
          />
        </div>
      </div>
    </div>
  );
};

AddHttp.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
