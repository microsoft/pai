import React, {useState} from 'react';
import c from 'classnames';
import {IconButton, Stack, TextField} from 'office-ui-fabric-react';
import {cloneDeep} from 'lodash';
import PropTypes from 'prop-types';

import {STORAGE_PREFIX} from '../../utils/constants';
import {InputData} from '../../models/data/input-data';
import t from '../../../../app/components/tachyons.scss';

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
    <Stack horizontal>
      <TextField
        required={true} // eslint-disable-line react/jsx-boolean-value
        prefix={STORAGE_PREFIX}
        label='Container Path'
        className={c(t.w40, t.mr3)}
        onChange={(_event, newValue) => {
          setMountPath(`${STORAGE_PREFIX}${newValue}`);
        }}
      />
      <TextField
        required={true} // eslint-disable-line react/jsx-boolean-value
        label='Http Address'
        className={c(t.w40, t.mr3)}
        onChange={(_event, newValue) => {
          setHttpUrl(newValue);
        }}
      />
      <Stack.Item align='end'>
        <IconButton iconProps={{iconName: 'Accept'}} onClick={submitMount} />
      </Stack.Item>
      <Stack.Item align='end'>
        <IconButton
          iconProps={{iconName: 'Cancel'}}
          onClick={() => {
            setDataType('none');
          }}
        />
      </Stack.Item>
    </Stack>
  );
};

AddHttp.propTypes = {
  dataList: PropTypes.arrayOf(PropTypes.instanceOf(InputData)),
  setDataList: PropTypes.func,
  setDataType: PropTypes.func,
};
